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

release_pr_action=create
may_force_push= 
tag_force=
if [[ "$1" == "--recut" ]]; then
  release_pr_action = edit
  tag_force=--tag-force
  may_force_push=-f
fi

# Perform the version bumps, generate changelog and create local tag. 
pnpm exec commit-and-tag-version ${tag_force} 
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

gh pr ${release_pr_action} \
  -H ${release_branch} \
  -B release-al2 \
  -t "build: release ${release_version}" \
  -F ${pr_body_file}

# cleanup
rm ${pr_body_file}
git checkout feat/build-script
git branch -D ${release_branch}
