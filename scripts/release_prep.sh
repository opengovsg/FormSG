#!/bin/bash

set -x

# pre-requisites: install github CLI
# - github documentation: https://github.com/cli/cli#installation
# - github is remote 'origin'

git fetch --all --tags
git reset --hard
git pull
git checkout develop
git reset --hard origin/develop

short_hash=$(git rev-parse --short HEAD)
temp_release_branch=temp_${short_hash}

git chekcout -b ${temp_release_branch}

release_version=$(npm --no-git-tag-version version minor | tail -n 1)
release_branch=release_${release_version}
may_force_push=

if [[ "$1" == "--recut" ]]; then
  git tag -d ${release_version}
  git push --delete origin ${release_version}
  git branch -D ${release_branch}
  may_force_push=-f
fi

git commit -a -m "chore: bump version to ${release_version}"
git tag ${release_version}
git checkout -b ${release_branch}
git branch -D ${temp_release_branch}

git push origin ${may_force_push} HEAD:${release_branch}
git push -f origin HEAD:staging-alt2
git push origin ${release_version}

# extract changelog to inject into the PR
# TODO: group changelog into sections automatically
pr_body_file=.pr_body_${release_version}
pr_body_file_groupped=.pr_body_${release_version}_groupped
awk "/#### \[${release_version}\]/{flag=1;next}/####/{flag=0}flag" CHANGELOG.md | sed '/^[[:space:]]*$/d' > ${pr_body_file}

echo "## New" > ${pr_body_file_groupped}
echo "" >> ${pr_body_file_groupped}
grep -v -E -- '- [a-z]+\(deps(-dev)?\)'  ${pr_body_file} >> ${pr_body_file_groupped}

echo "" >> ${pr_body_file_groupped}
echo "## Dependencies" >> ${pr_body_file_groupped}
echo "" >> ${pr_body_file_groupped}
grep -E -- '- [a-z]+\(deps\)'  ${pr_body_file} >> ${pr_body_file_groupped}

echo "" >> ${pr_body_file_groupped}
echo "## Dev-Dependencies" >> ${pr_body_file_groupped}
echo "" >> ${pr_body_file_groupped}
grep -E -- '- [a-z]+\(deps-dev\)'  ${pr_body_file} >> ${pr_body_file_groupped}

gh auth login
gh pr create \
  -w \
  -H ${release_branch} \
  -B release-al2 \
  -t "build: release ${release_version}" \
  -F ${pr_body_file}

# cleanup
rm ${pr_body_file}
rm ${pr_body_file_groupped}
git branch -D ${release_branch}
