#!/usr/bin/env bash
# Creates the GitHub environments and secrets used by .github/workflows/deploy.yml.
#
#   workflow/scripts/setup-github.sh <owner/repo> <secrets-file> <reviewer> [reviewer...]
#
# - "production" requires one of the reviewers to approve each deployment and accepts only master.
# - "development" accepts develop (deployments) and master (the scheduled keepalive job).
# - Secret values are read from the secrets file and passed to gh on stdin. They are never printed.
#   The file uses KEY=value lines: repository secrets by name, environment secrets prefixed
#   with DEV_ or PROD_.
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

REPO_SECRETS=(VERCEL_TOKEN VERCEL_ORG_ID VERCEL_PROJECT_ID SUPABASE_ACCESS_TOKEN)
ENV_SECRETS=(SUPABASE_PROJECT_REF SUPABASE_DB_PASSWORD SUPABASE_URL SUPABASE_PUBLISHABLE_KEY)

# Creates or updates an environment that only the given branches may deploy to.
create_environment() {
  local env=$1 reviewers_json=$2
  shift 2
  local branch existing

  jq -n --argjson reviewers "$reviewers_json" '{
    reviewers: (if ($reviewers | length) > 0 then $reviewers else null end),
    deployment_branch_policy: { protected_branches: false, custom_branch_policies: true }
  }' | gh api --silent -X PUT "repos/$repo/environments/$env" --input -

  existing=$(gh api "repos/$repo/environments/$env/deployment-branch-policies" \
    --jq '.branch_policies[].name')
  for branch in "$@"; do
    if ! grep -qx "$branch" <<<"$existing"; then
      gh api --silent -X POST "repos/$repo/environments/$env/deployment-branch-policies" \
        -f name="$branch" -f type=branch
    fi
  done
  echo "environment $env: deployable from $*"
}

# Sets secret $1 from file key $2, optionally inside environment $3. Skips empty values.
set_secret() {
  local name=$1 key=$2 env=${3:-} value scope=(-R "$repo")
  value=$(value_of "$secrets_file" "$key")
  if [ -z "$value" ]; then
    echo "  skipped $name (no value for $key)"
    return
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

echo "repository secrets:"
for name in "${REPO_SECRETS[@]}"; do set_secret "$name" "$name"; done

echo "development secrets:"
for name in "${ENV_SECRETS[@]}"; do set_secret "$name" "DEV_$name" development; done

echo "production secrets:"
for name in "${ENV_SECRETS[@]}"; do set_secret "$name" "PROD_$name" production; done
