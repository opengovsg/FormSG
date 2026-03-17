#!/bin/bash
set +x

# To hotfix: 
# 1. Make a new hotfix branch from release-al2 and the necessary fixes. 
# 2. Run this script from this hotfix branch. It will deploy the changes to stg and create a PR for release-al2.
# 3. Verify the changes on stg.
# 4. Merge the PR into release-al2. This deploys the changes to production.
# 5. Make a PR and merge release-al2 back to develop to sync the changes with develop. 

# CLI flags: 
# --recut If you have made changes after cutting, you can add this flag to use the newest changes for hotfix release.
# --nosquash The script squashes the changes in the hotfix branch into a single commit by default. This flag prevents the squashing if you want to keep the all the commits in the hotfix branch. 

# pre-requisites: install github CLI
# - github documentation: https://github.com/cli/cli#installation
# - github is remote 'origin'
# - PRs use test section LAST with heading "## Tests"
# - ALL build and release PRs start with "build: "

hotfix_branch=$(git branch --show-current)

if ! command -v gh >/dev/null 2>&1; then
    echo -e "\033[31mInstall gh first\033[0m"
    exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
    echo -e "\033[31mYou need to login: gh auth login\033[0m"
    exit 1
fi

has_local_changes=$(git status --porcelain --untracked-files=no --ignored=no)
if [[ ${has_local_changes} ]]; then
  set +x
  echo -e "\033[31m==========\033[0m"
  echo -e "\033[31mABORT: You have local modifications. Please stash or commit changes and run again.\033[0m"
  echo -e "\033[31m==========\033[0m"
  exit 1
fi

# Sync the remote hotfix/<description> branch 
echo -e "\033[34mFetching latest tags and pulling latest changes\033[0m"
git fetch --all --tags
git pull 

echo -e "\033[34mResetting to the latest commit on the remote hotfix branch\033[0m"
git reset --hard ${hotfix_branch}

# Create a temporary branch to squash commits and do version bumps
echo -e "\033[34mCreate a temporary branch to commit version bump changes\033[0m"
short_hash=$(git rev-parse --short HEAD)
temp_release_branch=temp_${short_hash}
# All subsequent actions are done on the temporary branch to prevent the hotfix branch from being polluted/modified.
git checkout -b ${temp_release_branch}

# Squash the commit history into single commit titled the branch name, unless --nosquash is provided
if [[ "$1" != "--nosquash" && "$2" != "--nosquash" ]]; then
  echo -e "\033[34mSquashing commit history into single commit titled the branch name\033[0m"
  git reset --soft release-al2
  git commit -a -n -m "fix: changes from ${hotfix_branch}"
fi

may_force_push=
tag_force=

if [[ "$1" == "--recut" || "$2" == "--recut" ]]; then
  tag_force=--tag-force
  may_force_push=-f
fi

pnpm exec commit-and-tag-version --config .internal.versionrc.js ${tag_force}
release_version_num=$(jq -r .version < package.json)
release_version="v${release_version_num}"
release_branch=release_${release_version}

echo -e "\033[34mNext patch version: ${release_version}\033[0m"


if [[ "$1" == "--recut" || "$2" == "--recut" ]]; then
  echo -e "\033[34mRecutting: Deleting local and remote tag and release branch\033[0m"
  # Delete the local and remote tag for this release version if it exists.
  git push --delete origin ${release_version}
  # Delete the local release branch for this release version if it exists.
  git branch -D ${release_branch}
fi

echo -e "\033[34mCreating release branch to merge into release-al2\033[0m"
git checkout -b ${release_branch}

echo -e "\033[34mDeleting temporary branch\033[0m"
git branch -D ${temp_release_branch}

echo -e "\033[34mPushing the updated release branch and tag to remote\033[0m" 
git push origin ${may_force_push} HEAD:${release_branch}
git push origin ${release_version}

echo -e "\033[34mPushing to stg for verification\033[0m"
git push -f origin HEAD:stg

echo -e "\033[34mCreating PR for release ${release_version} into release-al2\033[0m"
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

# Perform cleanup of temporary files and local release branch
echo -e "\033[34mCleaning up temporary files and local release branch\033[0m"
rm "${pr_body_actual}"
git checkout ${hotfix_branch}
git branch -D ${release_branch}

echo -e "\033[34mHotfix preparation complete\033[0m"