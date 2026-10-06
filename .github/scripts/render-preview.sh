#!/usr/bin/env bash
set -euo pipefail

: "${RENDER_API_KEY:?}"
OWNER_ID="${RENDER_OWNER_ID:-tea-dat51tbncjis73d4tda0}"
ENV_GROUP_ID="${RENDER_ENV_GROUP_ID:-evg-dav5d7vpn0mc73a79qu0}"
REPO_URL="${REPO_URL:-https://github.com/opengovsg/FormSG}"
API=https://api.render.com/v1

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
    jq -r --arg name "$1" '[.[].service | select(.name == $name)][0] // empty | "\(.id) \(.serviceDetails.url)"'
}

output() {
  if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "$1=$2" >>"$GITHUB_OUTPUT"; fi
  echo "$1=$2"
}

up() {
  local name=$1 branch=$2 existing id url created
  existing=$(find_service "$name")
  if [ -n "$existing" ]; then
    read -r id url <<<"$existing"
    render POST "/services/$id/deploys" '{"clearCache":"do_not_clear"}' >/dev/null
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
    render POST "/services/$id/deploys" '{"clearCache":"do_not_clear"}' >/dev/null
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

case "${1:-}" in
  up) up "$2" "$3" ;;
  down) down "$2" ;;
  *) echo "usage: $0 up <service-name> <branch> | down <service-name>" >&2; exit 64 ;;
esac
