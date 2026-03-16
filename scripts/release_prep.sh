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
git checkout feat/build-script
git reset --hard feat/build-script

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
release_version=$(jq -r .version < package.json)
release_tag="v${release_version}"
release_branch=release_${release_version}

if [[ "$1" == "--recut" ]]; then
  git push --delete origin ${release_tag}
  git branch -D ${release_branch}
fi

git checkout -b ${release_branch}
git branch -D ${temp_release_branch}

# Push the code and tag to origin
git push origin ${may_force_push} HEAD:${release_branch}
git push origin ${release_tag}

# Deploy to staging for verification testing
git push -f origin HEAD:stg

# extract changelog to inject into the PR
pr_body_file=.pr_body_${release_version}
awk "
  /^## \[${release_version}\]/ { flag=1; next }
  /^## \[/ { flag=0 }
  /^### Changelog$/ { flag=0 }
  flag
" CHANGELOG.md > ${pr_body_file}

# Check if a PR from this branch to release-al2 already exists; if so, use 'edit' action
head_ref="${release_branch}"
base_ref="release-al2"
existing_pr=$(gh pr list --state open --head "${head_ref}" --base "${base_ref}" --json number --jq '.[0].number' 2>/dev/null)
if [[ -n "${existing_pr}" ]]; then
  # PR already exists: update its title/body
  gh pr edit "${existing_pr}" \
    -t "build: release ${release_version}" \
    -F "${pr_body_file}"
else
  # No PR yet: create a new one
  gh pr create \
    -H "${release_branch}" \
    -B "${base_ref}" \
    -t "build: release ${release_version}" \
    -F "${pr_body_file}"
fi

# cleanup
rm ${pr_body_file}
git checkout feat/build-script
git branch -D ${release_branch}
