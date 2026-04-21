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
if [[ " $* " == *" --recut "* ]]; then
  tag_force=--tag-force
  may_force_push=-f
fi

# Perform the version bumps, generate changelog and create local tags.
# 1. Monorepo release (.internal.versionrc.js) — bumps apps/*/package.json,
#    packages/shared/package.json, etc. and creates a `v<version>` tag.
pnpm exec commit-and-tag-version --config .internal.versionrc.js ${tag_force}
release_version_num=$(jq -r .version < package.json)
release_version="v${release_version_num}"
release_branch=release_${release_version}

# 2. SDK release (.external.versionrc.js) — bumps packages/sdk/package.json,
#    updates packages/sdk/CHANGELOG.md and creates a `sdk-v<version>` tag.
#    Only runs if there are new commits touching packages/sdk since the last
#    sdk-v* tag. commit-and-tag-version does not exit non-zero when zero
#    commits match the path filter, so we guard explicitly.
sdk_release_version=
last_sdk_tag=$(git tag --sort=-version:refname -l 'sdk-v*' | head -1)
if [[ -n "${last_sdk_tag}" ]] && [[ -z "$(git log "${last_sdk_tag}..HEAD" --oneline -- packages/sdk)" ]]; then
  echo "No new SDK commits since ${last_sdk_tag}; skipping external (SDK) version bump."
elif pnpm exec commit-and-tag-version --config .external.versionrc.js ${tag_force}; then
  sdk_release_version_num=$(jq -r .version < packages/sdk/package.json)
  sdk_release_version="sdk-v${sdk_release_version_num}"
fi

if [[ " $* " == *" --recut "* ]]; then
  git push --delete origin ${release_version} || true
  if [[ -n "${sdk_release_version}" ]]; then
    git push --delete origin ${sdk_release_version} || true
  fi
  git branch -D ${release_branch}
fi

git checkout -b ${release_branch}
git branch -D ${temp_release_branch}

# Push the code and tags to origin
git push origin ${may_force_push} HEAD:${release_branch}
git push origin ${release_version}
if [[ -n "${sdk_release_version}" ]]; then
  git push origin ${sdk_release_version}
fi

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
