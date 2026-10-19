#!/usr/bin/env bash
# Creates the GitHub environments and secrets used by .github/workflows/deploy.yml.
#
#   workflow/scripts/setup-github.sh <owner/repo> <secrets-file> <reviewer> [reviewer...]
#
# - "production" requires one of the reviewers to approve each deployment and accepts only master.
# - "development" accepts develop (deployments) and master (the scheduled keepalive job).
# - Secret values are read from the secrets file and passed to gh on stdin. They are never printed.
#   The file uses KEY=value lines with every environment secret prefixed DEV_ or PROD_.
set -euo pipefail

# shellcheck source-path=SCRIPTDIR source=lib/secrets-file.sh
source "$(dirname "$0")/lib/secrets-file.sh"

if [ $# -lt 3 ]; then
  echo "usage: $0 <owner/repo> <secrets-file> <reviewer> [reviewer...]" >&2
  exit 2
fi

repo=$1
secrets_file=$2
shift 2
reviewers=("$@")

# Deployment-capable credentials are environment-scoped so the production reviewer gate runs before
# the production job can access them. Supply separate DEV_ and PROD_ values in the local secrets file.
ENV_SECRETS=(VERCEL_TOKEN VERCEL_ORG_ID VERCEL_PROJECT_ID SUPABASE_ACCESS_TOKEN SUPABASE_PROJECT_REF SUPABASE_DB_PASSWORD SUPABASE_URL SUPABASE_PUBLISHABLE_KEY)

# Validate everything before the first remote mutation so a typo cannot leave a partially updated
# environment or silently retain an old production credential.
for prefix in DEV PROD; do
  for name in "${ENV_SECRETS[@]}"; do
    if [ -z "$(value_of "$secrets_file" "${prefix}_$name")" ]; then
      echo "missing required key ${prefix}_$name in secrets file" >&2
      exit 2
    fi
  done
done

# Creates or updates an environment that only the given branches may deploy to.
create_environment() {
  local env=$1 reviewers_json=$2
  shift 2
  local branch existing actual expected environment_json actual_reviewers expected_reviewers

  jq -n --argjson reviewers "$reviewers_json" '{
    reviewers: (if ($reviewers | length) > 0 then $reviewers else null end),
    prevent_self_review: true,
    deployment_branch_policy: { protected_branches: false, custom_branch_policies: true }
  }' | gh api --silent -X PUT "repos/$repo/environments/$env" --input -

  existing=$(gh api "repos/$repo/environments/$env/deployment-branch-policies" \
    --jq '.branch_policies[].name')
  while IFS=$'\t' read -r id name; do
    [ -z "$id" ] && continue
    if ! printf '%s\n' "$@" | grep -Fxq "$name"; then
      gh api --silent -X DELETE "repos/$repo/environments/$env/deployment-branch-policies/$id"
      echo "environment $env: removed stale branch policy $name"
    fi
  done < <(gh api "repos/$repo/environments/$env/deployment-branch-policies" \
    --jq '.branch_policies[] | [.id, .name] | @tsv')
  for branch in "$@"; do
    if ! grep -qx "$branch" <<<"$existing"; then
      gh api --silent -X POST "repos/$repo/environments/$env/deployment-branch-policies" \
        -f name="$branch" -f type=branch
    fi
  done
  actual=$(gh api "repos/$repo/environments/$env/deployment-branch-policies" \
    --jq '.branch_policies[].name' | LC_ALL=C sort)
  expected=$(printf '%s\n' "$@" | LC_ALL=C sort)
  if [ "$actual" != "$expected" ]; then
    echo "environment $env: branch-policy reconciliation failed" >&2
    return 1
  fi
  if [ "$(jq 'length' <<<"$reviewers_json")" -gt 0 ]; then
    environment_json=$(gh api "repos/$repo/environments/$env")
    expected_reviewers=$(jq -c '[.[].id] | sort' <<<"$reviewers_json")
    actual_reviewers=$(jq -c \
      '[.protection_rules[]? | select(.type == "required_reviewers") | .reviewers[]?.reviewer.id] | sort' \
      <<<"$environment_json")
    if [ "$actual_reviewers" != "$expected_reviewers" ] || \
      ! jq -e '[.protection_rules[]? | select(.type == "required_reviewers") | .prevent_self_review] | any' \
        >/dev/null <<<"$environment_json"; then
      echo "environment $env: reviewer/self-review reconciliation failed" >&2
      return 1
    fi
  fi
  echo "environment $env: deployable from $*"
}

# Sets secret $1 from file key $2 inside environment $3. Values were prevalidated above.
set_secret() {
  local name=$1 key=$2 env=${3:-} value scope=(-R "$repo")
  value=$(value_of "$secrets_file" "$key")
  if [ -z "$value" ]; then
    echo "missing required key $key" >&2
    return 2
  fi
  [ -n "$env" ] && scope+=(--env "$env")
  printf '%s' "$value" | gh secret set "$name" "${scope[@]}"
  echo "  set $name${env:+ ($env)}"
}

reviewers_json=$(for login in "${reviewers[@]}"; do
  gh api "users/$login" --jq '{type: "User", id: .id}'
done | jq -s .)

create_environment production "$reviewers_json" master
create_environment development "[]" develop master

echo "development secrets:"
for name in "${ENV_SECRETS[@]}"; do set_secret "$name" "DEV_$name" development; done

echo "production secrets:"
for name in "${ENV_SECRETS[@]}"; do set_secret "$name" "PROD_$name" production; done
