#!/usr/bin/env bash
# Decides whether the Chromatic workflow should publish, writing to $GITHUB_OUTPUT:
#   eligible=true|false     edits that don't change the base, and dispatches on
#                           draft PRs, are skipped (the workflow's job-level
#                           `if` already skips pull_request events on drafts)
#   stack_ready=true|false  a stacked PR waits until its base PR is accepted in Chromatic
#
# A stacked PR built while its base PR still has unaccepted changes re-snapshots
# the whole stack below it, and usually again after the base is fixed. Gated PRs
# get a pending "Chromatic stack gate" status; chromatic-stack-unblock.yml
# re-dispatches them once the base PR's UI Tests pass.
set -euo pipefail

UI_TESTS='UI Tests: formsg-app'
GATE='Chromatic stack gate'

out() { echo "$1" >>"$GITHUB_OUTPUT"; }
state_of() { # <sha> <context>: latest state of a commit status, empty if none
  gh api "repos/$REPO/commits/$1/status" --jq ".statuses[] | select(.context == \"$2\") | .state"
}
set_gate() { # <sha> <state> <description> [target_url]
  gh api "repos/$REPO/statuses/$1" -f context="$GATE" -f state="$2" \
    -f description="$3" ${4:+-f target_url="$4"} >/dev/null
}

case "$EVENT" in
push)
  out eligible=true
  out stack_ready=true
  exit 0
  ;;
pull_request)
  if [ "$ACTION" = edited ] && [ "$BASE_CHANGED" != true ]; then
    out eligible=false
    exit 0
  fi
  draft=false base=$PR_BASE sha=$PR_SHA
  ;;
workflow_dispatch)
  pr=$(gh pr list --repo "$REPO" --head "$BRANCH" --state open \
    --json isDraft,baseRefName,headRefOid --jq '.[0] // empty')
  if [ -z "$pr" ]; then # manual run on a branch without a PR
    out eligible=true
    out stack_ready=true
    exit 0
  fi
  draft=$(jq -r .isDraft <<<"$pr")
  base=$(jq -r .baseRefName <<<"$pr")
  sha=$(jq -r .headRefOid <<<"$pr")
  ;;
*)
  echo "Unsupported event: $EVENT" >&2
  exit 1
  ;;
esac

if [ "$draft" = true ]; then
  out eligible=false
  exit 0
fi
out eligible=true

# Only gate PRs that would publish the frontend Storybook.
if [ "$FRONTEND" != true ] || [ "$base" = "$DEFAULT_BRANCH" ]; then
  out stack_ready=true
  exit 0
fi

parent=$(gh pr list --repo "$REPO" --head "$base" --state open \
  --json number,headRefOid,url --jq '.[0] // empty')
blocked=false
if [ -n "$parent" ]; then
  parent_sha=$(jq -r .headRefOid <<<"$parent")
  ui=$(state_of "$parent_sha" "$UI_TESTS")
  gate=$(state_of "$parent_sha" "$GATE")
  # No UI Tests status and no pending gate means the base PR never needed
  # Chromatic (e.g. backend-only), so it doesn't block.
  if [ "$ui" != success ] && { [ -n "$ui" ] || [ "$gate" = pending ]; }; then
    blocked=true
  fi
fi

if [ "$blocked" = true ]; then
  set_gate "$sha" pending \
    "Waiting for Chromatic on #$(jq -r .number <<<"$parent") to be accepted" \
    "$(jq -r .url <<<"$parent")"
  out stack_ready=false
else
  if [ "$(state_of "$sha" "$GATE")" = pending ]; then
    set_gate "$sha" success 'Base PR accepted in Chromatic'
  fi
  out stack_ready=true
fi
