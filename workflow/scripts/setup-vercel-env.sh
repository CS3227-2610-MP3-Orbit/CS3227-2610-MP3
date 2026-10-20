#!/usr/bin/env bash
# Sets the Vercel environment variables of the linked project from a KEY=value secrets file:
# Preview gets the DEV_ values (dev Supabase project), Production the PROD_ values.
# SoC LLM settings are shared by both. Run from the repository root after `vercel link`.
#
#   workflow/scripts/setup-vercel-env.sh <secrets-file>
#
# Values are passed to the Vercel CLI on stdin and never printed. Re-running overwrites them.
# NEXT_PUBLIC_* values are built into the browser code, so they are added as non-sensitive;
# server-only keys stay sensitive (write-only in the dashboard).
set -euo pipefail

# shellcheck source-path=SCRIPTDIR source=lib/secrets-file.sh
source "$(dirname "$0")/lib/secrets-file.sh"

secrets_file=${1:?usage: $0 <secrets-file>}

# Vercel variable, key in the secrets file (PREFIX_ = DEV_ or PROD_), visibility
VARIABLES=(
  "NEXT_PUBLIC_SUPABASE_URL PREFIX_SUPABASE_URL public"
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY PREFIX_SUPABASE_PUBLISHABLE_KEY public"
  "SUPABASE_SECRET_KEY PREFIX_SUPABASE_SECRET_KEY sensitive"
  "SOCLAAS_BASE_URL SOCLAAS_BASE_URL public"
  "SOCLAAS_MODEL SOCLAAS_MODEL public"
  "SOCLAAS_API_KEY SOCLAAS_API_KEY sensitive"
)

add_variable() {
  local name=$1 key=$2 visibility=$3 target=$4 value output flags=(--force --yes)
  value=$(value_of "$secrets_file" "$key")
  if [ -z "$value" ]; then
    echo "  skipped $name (no value for $key)"
    return
  fi
  if [ "$visibility" = public ]; then flags+=(--no-sensitive); fi
  # Preview takes a Git branch argument; "" means all Preview branches. Without it the CLI asks
  # interactively after stdin has been consumed, and exits successfully without saving anything.
  local branch=()
  if [ "$target" = preview ]; then branch=(""); fi
  if ! output=$(printf '%s' "$value" | vercel env add "$name" "$target" ${branch[@]+"${branch[@]}"} "${flags[@]}" 2>&1); then
    echo "  FAILED $name:" >&2
    echo "$output" >&2
    exit 1
  fi
  echo "  set $name ($visibility)"
}

for target in preview production; do
  prefix=DEV
  [ "$target" = production ] && prefix=PROD
  echo "$target:"
  for row in "${VARIABLES[@]}"; do
    read -r name key visibility <<<"$row"
    add_variable "$name" "${key/PREFIX/$prefix}" "$visibility" "$target"
  done
done
