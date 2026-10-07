#!/usr/bin/env bash
set -euo pipefail

: "${RENDER_API_KEY:?}"
OWNER_ID="${RENDER_OWNER_ID:-tea-dat51tbncjis73d4tda0}"
ENV_GROUP_ID="${RENDER_ENV_GROUP_ID:-evg-dav5d7vpn0mc73a79qu0}"
REPO_URL="${REPO_URL:-https://github.com/opengovsg/FormSG}"
API=https://api.render.com/v1
IDLE_HOURS="${IDLE_HOURS:-24}"

render() {
  local method=$1 path=$2 args=()
  if [ -n "${3:-}" ]; then args=(-H 'Content-Type: application/json' --data "$3"); fi
  curl -sS --fail-with-body -X "$method" "$API$path" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H 'Accept: application/json' \
    ${args[@]+"${args[@]}"}
}

find_service() {
  render GET "/services?ownerId=$OWNER_ID&name=$1&limit=20" |
    jq -r --arg name "$1" '[.[].service | select(.name == $name)][0] // empty | "\(.id) \(.serviceDetails.url) \(.suspended)"'
}

deploy() {
  render POST "/services/$1/deploys" '{"clearCache":"do_not_clear"}' >/dev/null
}

output() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "$1=$2" >>"$GITHUB_OUTPUT"; fi
  echo "$1=$2"
}

up() {
  local name=$1 branch=$2 existing id url suspended created
  existing=$(find_service "$name")
  if [ -n "$existing" ]; then
    read -r id url suspended <<<"$existing"
    if [ "$suspended" = suspended ]; then render POST "/services/$id/resume" >/dev/null; fi
    deploy "$id"
    created=false
  else
    created=$(jq -n --arg name "$name" --arg owner "$OWNER_ID" --arg repo "$REPO_URL" --arg branch "$branch" '{
      type: "web_service",
      name: $name,
      ownerId: $owner,
      repo: $repo,
      branch: $branch,
      autoDeploy: "yes",
      envVars: [{key: "PORT", value: "4545"}],
      serviceDetails: {
        runtime: "docker",
        region: "singapore",
        plan: "standard",
        pullRequestPreviewsEnabled: "no",
        envSpecificDetails: {dockerfilePath: "./Dockerfile.render", dockerContext: "."}
      }
    }' | render POST /services "$(cat)")
    id=$(jq -r '.service.id' <<<"$created")
    url=$(jq -r '.service.serviceDetails.url' <<<"$created")
    local first_deploy
    first_deploy=$(jq -r '.deployId // empty' <<<"$created")
    if [ -n "$first_deploy" ]; then
      render POST "/services/$id/deploys/$first_deploy/cancel" >/dev/null || true
    fi
    render POST "/env-groups/$ENV_GROUP_ID/services/$id" >/dev/null
    render PUT "/services/$id/env-vars/APP_URL" "$(jq -n --arg v "$url" '{value: $v}')" >/dev/null
    deploy "$id"
    created=true
  fi
  output url "$url"
  output dashboard "https://dashboard.render.com/web/$id"
  output created "$created"
}

down() {
  local name=$1 existing id
  existing=$(find_service "$name")
  if [ -z "$existing" ]; then
    output deleted false
    return
  fi
  read -r id _ <<<"$existing"
  render DELETE "/services/$id" >/dev/null
  output deleted true
}

wake() {
  local name=$1 sha=$2 existing id url suspended deployed
  existing=$(find_service "$name")
  if [ -z "$existing" ]; then
    output woke missing
    return
  fi
  read -r id url suspended <<<"$existing"
  output url "$url"
  if [ "$suspended" != suspended ]; then
    output woke false
    return
  fi
  render POST "/services/$id/resume" >/dev/null
  deployed=$(render GET "/services/$id/deploys?limit=1" | jq -r '.[0].deploy.commit.id // empty')
  if [ "$deployed" != "$sha" ]; then deploy "$id"; fi
  output woke true
}

to_epoch='sub("\\.[0-9]+"; "") | fromdateiso8601'

last_activity() {
  local id=$1 updated=$2 events requests since
  events=$(render GET "/services/$id/events?limit=100" |
    jq "[.[].event | select(.type | IN(\"deploy_started\", \"build_started\", \"service_resumed\")) | .timestamp | $to_epoch] | max // 0") || events=0
  since=$(jq -rn --argjson h "$IDLE_HOURS" '(now - ($h + 1) * 3600) | todate')
  requests=$(render GET "/metrics/http-requests?resource=$id&startTime=$since&resolutionSeconds=3600" |
    jq "[.[].values[]? | select(.value > 0) | .timestamp | $to_epoch] | max // 0") || requests=0
  jq -n --argjson a "$events" --argjson b "$requests" --argjson c "$(jq -n --arg t "$updated" "\$t | $to_epoch")" '[$a, $b, $c] | max'
}

comment() {
  if [ "$DRY_RUN" != true ]; then gh pr comment "$1" --repo "$GITHUB_REPOSITORY" --body "$2" >/dev/null; fi
}

sweep() {
  : "${GITHUB_REPOSITORY:?}"
  DRY_RUN="${DRY_RUN:-true}"
  local now services id name suspended updated pr state last idle
  now=$(date +%s)
  services=$(render GET "/services?ownerId=$OWNER_ID&limit=100" |
    jq -r '.[].service | select(.name | test("^formsg-pr-[0-9]+$")) | "\(.id) \(.name) \(.suspended) \(.updatedAt)"')
  while read -r -u 3 id name suspended updated; do
    [ -n "$id" ] || continue
    pr=${name#formsg-pr-}
    state=$(gh pr view "$pr" --repo "$GITHUB_REPOSITORY" --json state -q .state)
    if [ "$state" != OPEN ]; then
      echo "$name: PR is $state, deleting"
      if [ "$DRY_RUN" != true ]; then render DELETE "/services/$id" >/dev/null; fi
      continue
    fi
    if [ "$suspended" = suspended ]; then
      echo "$name: already suspended"
      continue
    fi
    last=$(last_activity "$id" "$updated")
    idle=$(((now - last) / 3600))
    if [ "$idle" -lt "$IDLE_HOURS" ]; then
      echo "$name: active ${idle}h ago, keeping"
      continue
    fi
    echo "$name: idle ${idle}h, suspending"
    if [ "$DRY_RUN" != true ]; then render POST "/services/$id/suspend" >/dev/null; fi
    comment "$pr" "Render preview suspended after ${IDLE_HOURS}h with no deploys or visits. Comment \`/preview wake\` or push a commit to bring it back."
  done 3<<<"$services"
}

case "${1:-}" in
  up) up "$2" "$3" ;;
  down) down "$2" ;;
  wake) wake "$2" "$3" ;;
  sweep) sweep ;;
  *) echo "usage: $0 up <service-name> <branch> | down <service-name> | wake <service-name> <sha> | sweep" >&2; exit 64 ;;
esac
