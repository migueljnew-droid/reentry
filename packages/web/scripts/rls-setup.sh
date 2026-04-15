#!/usr/bin/env bash
# RLS test harness — brings up local Supabase (if Docker is running)
# and exports the env vars the integration tests expect.
#
# Usage:
#   source packages/web/scripts/rls-setup.sh
#   npx vitest run src/__tests__/rls.integration.test.ts
#
# Or as a one-shot (in a subshell — env won't persist to your terminal):
#   packages/web/scripts/rls-setup.sh run
#
# Exits early with a clear message if Docker isn't reachable.

set -u

if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker daemon not reachable. Start Docker Desktop and re-run."
  [[ "${BASH_SOURCE[0]:-$0}" == "$0" ]] && exit 1 || return 1
fi

cd "$(dirname "$0")/../../.."  # repo root

if ! supabase status >/dev/null 2>&1; then
  echo "▶ Starting local Supabase (first run takes a minute)..."
  supabase start || {
    echo "❌ supabase start failed."
    [[ "${BASH_SOURCE[0]:-$0}" == "$0" ]] && exit 1 || return 1
  }
fi

# Pull URL + keys from supabase status JSON.
STATUS_JSON="$(supabase status -o json)"
export SUPABASE_URL="$(echo "$STATUS_JSON" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d.get('API_URL','http://127.0.0.1:54321'))")"
export SUPABASE_ANON_KEY="$(echo "$STATUS_JSON" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d.get('ANON_KEY',''))")"
export SUPABASE_SERVICE_ROLE_KEY="$(echo "$STATUS_JSON" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d.get('SERVICE_ROLE_KEY',''))")"

echo "✓ Supabase running at $SUPABASE_URL"
echo "  SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY exported"

# Optional one-shot mode: pass `run` to execute the RLS test suite in a subshell.
if [[ "${1:-}" == "run" ]]; then
  cd packages/web
  TMPDIR=/tmp npx vitest run src/__tests__/rls.integration.test.ts
fi
