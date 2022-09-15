#!/bin/bash

set -x

# pre-requisites: instal github CLI
# - github documentation: https://github.com/cli/cli#installation
# - github is remote 'origin'

git reset --hard
git pull
git checkout develop
git reset --hard origin/develop

short_hash=$(git rev-parse --short HEAD)
temp_release_branch=temp_${short_hash}

git chekcout -b ${temp_release_branch}

release_version=$(npm --no-git-tag-version version minor | tail -n 1)

git commit -a -m "chore: bump version to ${release_version}"
git tag ${release_version}

release_branch=release_${release_version}

git checkout -b ${release_branch}
git branch -D ${temp_release_branch}

git push origin HEAD:${release_branch}
git push -f origin HEAD:staging-alt2

# extract changelog to inject into the PR
# TODO: group changelog into sections automatically
pr_body_file=.pr_body_${release_version}
awk "/#### \[${release_version}\]/{flag=1;next}/####/{flag=0}flag" CHANGELOG.md > ${pr_body_file}

gh auth login
gh pr create \
  -w \
  -H ${release_branch} \
  -B release-al2 \
  -t "build: release ${release_version}" \
  -F ${pr_body_file}

# cleanup
rm ${pr_body_file}
