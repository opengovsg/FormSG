#!/bin/bash

set -x

# pre-requisites: install github CLI
# - github documentation: https://github.com/cli/cli#installation
# - github is remote 'origin'
# - PRs use test section LAST with heading "## Tests"
# - ALL build and release PRs start with "build: "

has_local_changes=$(git status --porcelain --untracked-files=no --ignored=no)
if [[ ${has_local_changes} ]]; then
  set +x
  echo ==========
  echo "ABORT: You have local modifications. Please stash or commit changes and run again."
  echo ==========
  exit 1
fi

git fetch --all --tags
git reset --hard
git pull
git checkout develop
git reset --hard origin/develop

short_hash=$(git rev-parse --short HEAD)
temp_release_branch=temp_${short_hash}

git checkout -b ${temp_release_branch}

release_version=$(npm --no-git-tag-version version minor | grep -E '^v\d')
# Also update the version in frontend directory
npm --prefix frontend --no-git-tag-version version minor
release_branch=release_${release_version}
may_force_push=

if [[ "$1" == "--recut" ]]; then
  git tag -d ${release_version}
  git push --delete origin ${release_version}
  git branch -D ${release_branch}
  may_force_push=-f
fi

git commit -a -n -m "chore: bump version to ${release_version}"
git tag ${release_version}
git checkout -b ${release_branch}
git branch -D ${temp_release_branch}

git push origin ${may_force_push} HEAD:${release_branch}
git push -f origin HEAD:staging-al2
git push origin ${release_version}

# extract changelog to inject into the PR
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

gh auth login

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

gh pr create \
  -w \
  -H ${release_branch} \
  -B release-al2 \
  -t "build: release ${release_version}" \
  -F ${pr_body_file_groupped}

# cleanup
rm ${pr_body_file}
rm ${pr_body_file_groupped}
git branch -D ${release_branch}
