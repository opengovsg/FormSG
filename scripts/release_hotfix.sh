#!/bin/bash
set +x

# To hotfix: 
# 1. Make a new hotfix branch from release-al2 and then apply the hotfix 
# 2. Run this script from this hotfix branch. 

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

# From current hotfix/<description> branch 
# Print in blue using ANSI escape codes
echo -e "\033[34mFetching latest tags and pulling latest changes\033[0m"
git fetch --all --tags
git pull

echo -e "\033[34mResetting to the latest commit on the hotfix branch\033[0m"
git reset --hard


echo -e "\033[34mCreate a temporary branch to commit version bump changes\033[0m"
short_hash=$(git rev-parse --short HEAD)
temp_release_branch=temp_${short_hash}
git checkout -b ${temp_release_branch}

echo -e "\033[34mBumping version to next patch version\033[0m"
# Update the version in the root directory
release_version=$(npm --no-git-tag-version version patch | grep -E '^v\d')
# Update the version in frontend directory
npm --prefix frontend --no-git-tag-version version patch
release_branch=release_${release_version}
may_force_push=

if [[ "$1" == "--recut" || "$2" == "--recut" ]]; then
  echo -e "\033[34mRecutting: Deleting local and remote tag and release branch\033[0m"
  # Delete the local tag for this release version if it exists.
  git tag -d ${release_version}
  # Delete the remote tag for this release version on the origin repository.
  git push --delete origin ${release_version}
  # Delete the local release branch for this release version if it exists.
  git branch -D ${release_branch}
  may_force_push=-f
fi

# Squash the commit history into single commit titled the branch name, unless --nosquash is provided
if [[ "$1" != "--nosquash" && "$2" != "--nosquash" ]]; then
  echo -e "\033[34mSquashing commit history into single commit titled the branch name\033[0m"
  git reset --soft release-al2
  git commit -a -n -m "fix: changes from ${hotfix_branch}"
fi

git commit -a -n -m "chore: bump version to ${release_version}"
git tag ${release_version}

echo -e "\033[34mCreating release branch to merge into release-al2\033[0m"
git checkout -b ${release_branch}

echo -e "\033[34mDeleting temporary branch\033[0m"
git branch -D ${temp_release_branch}

echo -e "\033[34mCreating the release branch to remote\033[0m" 
git push origin ${may_force_push} HEAD:${release_branch}
git push -f origin HEAD:stg
git push origin ${release_version}

echo -e "\033[34mCreating PR for release ${release_version} into release-al2\033[0m"
# # extract changelog to inject into the PR
pr_body_file=.pr_body_${release_version}
pr_body_file_groupped=.pr_body_${release_version}_groupped

awk "/#### \[${release_version}\]/{flag=1;next}/####/{flag=0}flag" CHANGELOG.md | sed -E '/^([^-]|[[:space:]]*$)/d' > ${pr_body_file}

echo "## New" > ${pr_body_file_groupped}
echo "" >> ${pr_body_file_groupped}
grep -v -E -- '- [a-z]+\(deps(-dev)?\)' ${pr_body_file} >> ${pr_body_file_groupped}

echo "" >> ${pr_body_file_groupped}
echo "## Dependencies" >> ${pr_body_file_groupped}
echo "" >> ${pr_body_file_groupped}
grep -E -- '- [a-z]+\(deps\)' ${pr_body_file} >> ${pr_body_file_groupped}

echo "" >> ${pr_body_file_groupped}
echo "## Dev-Dependencies" >> ${pr_body_file_groupped}
echo "" >> ${pr_body_file_groupped}
grep -E -- '- [a-z]+\(deps-dev\)' ${pr_body_file} >> ${pr_body_file_groupped}

## Extract test procedures for feature PRs
echo "" >> ${pr_body_file_groupped}
echo "## Tests" >> ${pr_body_file_groupped}
echo "" >> ${pr_body_file_groupped}
grep -v -E -- '- [a-z]+\(deps(-dev)?\)' ${pr_body_file} | grep -v -E -- '- build: ' | while read line_item; do
  pr_id=$(echo ${line_item} | grep -o -E '\[`#\d+`\]' | grep -o -E '\d+')
  tests=$(gh pr view ${pr_id} | awk 'f;/^#+ Tests?/{f=1}' | sed -E "s/\[[Xx]\]/[ ]/" | sed -E "s/^(##+) /\1## /")
  if [[ ${tests} =~ [^[:space:]] ]]; then
    echo ${line_item} | sed "s/^- /### /" >> ${pr_body_file_groupped}
    echo "${tests}" >> ${pr_body_file_groupped}
    echo "" >> ${pr_body_file_groupped}
  fi
done

# Creating PR to merge into release-al2
gh pr create \
  -H "${release_branch}" \
  -B "release-al2" \
  -t "build: release ${release_version}" \
  -F "${pr_body_file_groupped}" \
  || gh pr edit ${release_branch} \
    -B "release-al2" \
    -t "build: release ${release_version}" \
    -F "${pr_body_file_groupped}"

# Perform cleanup of temporary files and local release branch
echo -e "\033[34mCleaning up temporary files and local release branch\033[0m"
rm ${pr_body_file}
rm ${pr_body_file_groupped}
git checkout ${hotfix_branch}
git branch -D ${release_branch}

echo -e "\033[34mHotfix preparation complete\033[0m"