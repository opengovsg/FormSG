#!/bin/bash
set +x

# pre-requisites: install github CLI
# - github documentation: https://github.com/cli/cli#installation
# - github is remote 'origin'
# - PRs use test section LAST with heading "## Tests"
# - ALL build and release PRs start with "build: "

if ! command -v gh >/dev/null 2>&1; then
    echo "Install gh first"
    exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
    echo "You need to login: gh auth login"
    exit 1
fi

has_local_changes=$(git status --porcelain --untracked-files=no --ignored=no)
if [[ ${has_local_changes} ]]; then
  set +x
  echo ==========
  echo "ABORT: You have local modifications. Please stash or commit changes and run again."
  echo ==========
  exit 1
fi

# Force sync with origin/develop
git fetch --all --tags
git reset --hard
git pull
git checkout develop
git reset --hard develop

# Create temp branch for version bump and changelog generation
short_hash=$(git rev-parse --short HEAD)
temp_release_branch=temp_${short_hash}
git checkout -b ${temp_release_branch}

may_force_push= 
tag_force=
if [[ "$1" == "--recut" ]]; then
  tag_force=--tag-force
  may_force_push=-f
fi

# Perform the version bumps, generate changelog and create local tag. 
pnpm exec commit-and-tag-version --config .internal.versionrc.js ${tag_force}
release_version_num=$(jq -r .version < package.json)
release_version="v${release_version_num}"
release_branch=release_${release_version}

if [[ "$1" == "--recut" ]]; then
  git push --delete origin ${release_version}
  git branch -D ${release_branch}
fi

git checkout -b ${release_branch}
git branch -D ${temp_release_branch}

# Push the code and tag to origin
git push origin ${may_force_push} HEAD:${release_branch}
git push origin ${release_version}

# Deploy to staging for verification testing
git push -f origin HEAD:stg

pr_body_actual=".pr_body_actual_${release_version}"
scripts/generate_pr_body.sh "${release_version_num}" CHANGELOG.md > "${pr_body_actual}"

# Creating PR to merge into release-al2: edit if it already exists, else create
existing_pr=$(gh pr list --state open --head "${release_branch}" --base "release-al2" --json number --jq '.[0].number' 2>/dev/null)
if [[ -n "${existing_pr}" ]]; then
  gh pr edit "${existing_pr}" \
    -t "build: release ${release_version}" \
    -F "${pr_body_actual}"
else
  gh pr create \
    -H "${release_branch}" \
    -B "release-al2" \
    -t "build: release ${release_version}" \
    -F "${pr_body_actual}"
fi

# cleanup
rm "${pr_body_actual}"
git checkout develop
git branch -D ${release_branch}
