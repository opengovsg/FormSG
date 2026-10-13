#!/usr/bin/env bash
# Holds Chromatic on a stacked PR until the nearest PR below it that touches
# the frontend has passed "UI Tests: formsg-app" (changes accepted, or none).
# A stacked PR's Chromatic diff covers the whole stack below it, so building
# it while the base still awaits review re-snapshots everything, usually twice.
#
#   chromatic-stack.sh gate     run by chromatic.yml (PR code, read-only token);
#                               writes eligible/stack_ready to $GITHUB_OUTPUT
#   chromatic-stack.sh unblock  run by chromatic-stack-unblock.yml (default
#                               branch code) when a commit's UI Tests pass;
#                               re-dispatches Chromatic for the PRs it held
#
# Nothing here writes commit statuses, so the PR-side token stays read-only.
set -euo pipefail

UI_TESTS='UI Tests: formsg-app'
# Must match the `frontend` paths-filter in chromatic.yml.
FRONTEND_PATHS='^(apps/frontend/|packages/shared/|pnpm-lock\.yaml$|\.github/workflows/chromatic\.yml$|\.github/scripts/chromatic-[^/]*\.sh$)'

out() { echo "$1" >>"$GITHUB_OUTPUT"; }
ui_tests() { # <sha>: latest UI Tests state, empty if Chromatic never reported
  gh api "repos/$REPO/commits/$1/status" \
    --jq ".statuses[] | select(.context == \"$UI_TESTS\") | .state"
}
touches_frontend() { # <pr number>: does the PR's own diff touch the frontend?
  local files
  files=$(gh api "repos/$REPO/pulls/$1/files" --paginate --jq '.[].filename')
  grep -qE "$FRONTEND_PATHS" <<<"$files"
}

# Prints the nearest open PR below <base> that touches the frontend and hasn't
# passed UI Tests, as JSON. Backend-only PRs never get a UI Tests status, so
# they are walked through rather than treated as passed or pending.
blocking_pr() { # <base branch>
  local base=$1 pr hops=0
  while [ "$base" != "$DEFAULT_BRANCH" ] && [ $((hops += 1)) -le 20 ]; do
    pr=$(gh pr list --repo "$REPO" --head "$base" --state open \
      --json number,headRefOid,baseRefName,url --jq '.[0] // empty')
    [ -n "$pr" ] || return 0 # base isn't an open PR (e.g. merged)
    if touches_frontend "$(jq -r .number <<<"$pr")"; then
      [ "$(ui_tests "$(jq -r .headRefOid <<<"$pr")")" = success ] || echo "$pr"
      return 0
    fi
    base=$(jq -r .baseRefName <<<"$pr")
  done
}

gate() {
  local draft base
  case "$EVENT" in
  push)
    out eligible=true
    out stack_ready=true
    return
    ;;
  pull_request)
    # Drafts are already skipped by the changes job's `if`.
    if [ "$ACTION" = edited ] && [ "$BASE_CHANGED" != true ]; then
      out eligible=false
      return
    fi
    draft=false base=$PR_BASE
    ;;
  workflow_dispatch)
    local pr
    pr=$(gh pr list --repo "$REPO" --head "$REF_NAME" --state open \
      --json isDraft,baseRefName --jq '.[0] // empty')
    if [ -z "$pr" ]; then # manual run on a branch without a PR
      out eligible=true
      out stack_ready=true
      return
    fi
    draft=$(jq -r .isDraft <<<"$pr")
    base=$(jq -r .baseRefName <<<"$pr")
    ;;
  *)
    echo "Unsupported event: $EVENT" >&2
    exit 1
    ;;
  esac

  if [ "$draft" = true ]; then
    out eligible=false
    return
  fi
  out eligible=true

  local blocker=''
  if [ "$FRONTEND" = true ]; then
    blocker=$(blocking_pr "$base")
  fi
  if [ -n "$blocker" ]; then
    local msg
    msg="Chromatic skipped: waiting for #$(jq -r .number <<<"$blocker") to pass UI Tests. It re-runs automatically once that PR's changes are accepted."
    echo "::notice title=Chromatic stack gate::$msg"
    echo "$msg ($(jq -r .url <<<"$blocker"))" >>"$GITHUB_STEP_SUMMARY"
    out stack_ready=false
  else
    out stack_ready=true
  fi
}

# Dispatches Chromatic for open PRs stacked on <branch> that were held: they
# touch the frontend and Chromatic never reported on their head. Backend-only
# PRs are walked through to the PRs stacked on them.
unblock_children() { # <branch>
  local children number head sha
  children=$(gh pr list --repo "$REPO" --base "$1" --state open \
    --json number,headRefName,headRefOid,isDraft \
    --jq '.[] | select(.isDraft | not) | "\(.number) \(.headRefName) \(.headRefOid)"')
  while read -r number head sha; do
    [ -n "$number" ] || continue
    if ! touches_frontend "$number"; then
      unblock_children "$head"
    elif [ -z "$(ui_tests "$sha")" ]; then
      # If a build for this head is still starting, the dispatched run
      # replaces it via the job's concurrency group.
      echo "Dispatching Chromatic for #$number ($head)"
      # Fails if the branch predates workflow_dispatch in chromatic.yml;
      # it gets built on its next push instead.
      gh workflow run chromatic.yml --repo "$REPO" --ref "$head" ||
        echo "::warning::Could not dispatch Chromatic for $head"
    fi
  done <<<"$children"
}

unblock() {
  local branch
  # BRANCHES: JSON list of branches whose head is the commit that passed.
  for branch in $(jq -r '.[].name' <<<"$BRANCHES"); do
    unblock_children "$branch"
  done
}

"$@"
