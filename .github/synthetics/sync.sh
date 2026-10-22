#!/usr/bin/env bash
set -euo pipefail

# Datadog synthetic tests as code. Test definitions live in tests/*.json
# (Datadog Synthetics API schema); ids.json maps each file's basename to the
# public_id of the test it manages in Datadog.
#
#   sync.sh push   create/update every tests/*.json in Datadog
#   sync.sh pull   overwrite tests/*.json from the live Datadog definitions
#
# push on a file with no ids.json entry first looks for a live test with the
# same name (adopts its id) and only then CREATES one, recording the public_id
# in ids.json — so re-running push can never duplicate a test, and CI commits
# the ids.json change back. Test names are the identity key: keep them unique.
# Requires DD_API_KEY and DD_APP_KEY (synthetics_read + synthetics_write).

: "${DD_API_KEY:?}" "${DD_APP_KEY:?}"
DIR=$(cd "$(dirname "$0")" && pwd)
API=https://api.datadoghq.com/api/v1/synthetics
IDS="$DIR/ids.json"

dd() {
  local method=$1 path=$2 out
  shift 2
  if ! out=$(curl -sS --fail-with-body -X "$method" "$API$path" \
    -H "DD-API-KEY: $DD_API_KEY" \
    -H "DD-APPLICATION-KEY: $DD_APP_KEY" \
    -H 'Content-Type: application/json' "$@" 2>&1); then
    echo "$method $path: $out" >&2
    return 1
  fi
  printf '%s' "$out"
}

# Create/update use /tests/api/… and /tests/browser/…; GET uses /tests/{id}
# for api tests but /tests/browser/{id} for browser tests (API quirk).
write_path() { if [ "$1" = browser ]; then echo "/tests/browser"; else echo "/tests/api"; fi; }
read_path() { if [ "$1" = browser ]; then echo "/tests/browser/$2"; else echo "/tests/$2"; fi; }

push() {
  local file slug type id name created=false failed=
  for file in "$DIR"/tests/*.json; do
    slug=$(basename "$file" .json)
    type=$(jq -r '.type' "$file")
    id=$(jq -r --arg s "$slug" '.[$s] // empty' "$IDS")
    if [ -n "$id" ]; then
      if dd PUT "$(write_path "$type")/$id" --data @"$file" >/dev/null; then
        echo "updated $slug ($id)"
      else
        failed="$failed $slug"
      fi
    else
      # Adopt a live test with the same name before creating, so a lost
      # ids.json entry (failed commit-back, manual wipe) never duplicates.
      name=$(jq -r '.name' "$file")
      id=$(dd GET "/tests" | jq -r --arg n "$name" '[.tests[] | select(.name == $n).public_id][0] // empty')
      if [ -n "$id" ]; then
        if dd PUT "$(write_path "$type")/$id" --data @"$file" >/dev/null; then
          jq --arg s "$slug" --arg id "$id" '.[$s] = $id' "$IDS" >"$IDS.tmp" && mv "$IDS.tmp" "$IDS"
          echo "adopted $slug ($id)"
          created=true
        else
          failed="$failed $slug"
        fi
      elif id=$(dd POST "$(write_path "$type")" --data @"$file" | jq -r '.public_id') && [ -n "$id" ]; then
        jq --arg s "$slug" --arg id "$id" '.[$s] = $id' "$IDS" >"$IDS.tmp" && mv "$IDS.tmp" "$IDS"
        echo "created $slug ($id)"
        created=true
      else
        failed="$failed $slug"
      fi
    fi
  done
  if [ "$created" = true ]; then
    echo 'ids.json gained new entries — commit it or CI cannot trigger the new tests.' >&2
  fi
  if [ -n "$failed" ]; then
    echo "failed:$failed" >&2
    exit 1
  fi
}

pull() {
  local file slug type id
  for file in "$DIR"/tests/*.json; do
    slug=$(basename "$file" .json)
    type=$(jq -r '.type' "$file")
    id=$(jq -r --arg s "$slug" '.[$s] // empty' "$IDS")
    if [ -z "$id" ]; then
      echo "skipped $slug (no ids.json entry)"
      continue
    fi
    dd GET "$(read_path "$type" "$id")" |
      jq 'del(.public_id, .monitor_id, .org_id, .created_at, .modified_at,
              .created_by, .modified_by, .creator, .overall_state,
              .overall_state_modified, .stepCount)' >"$file"
    echo "pulled $slug ($id)"
  done
}

case "${1:-}" in
  push) push ;;
  pull) pull ;;
  *)
    echo "usage: sync.sh push|pull" >&2
    exit 64
    ;;
esac
