#!/bin/bash

set -x

# To be executed after release has been deployed to prod
# pre-requisites: install github CLI
# - github documentation: https://github.com/cli/cli#installation

git fetch --all --tags
git checkout release-al2
git reset --hard origin/release-al2

# get latest release version
release_version=$(git ls-remote --tags --sort=creatordate | grep -o 'v.*' | tail -1)
echo ${release_version}

# push latest release to UAT
git push -f origin release-al2:uat

# Create PR to merge release-al2 to develop
gh pr create \
  -H release-al2 \
  -B develop \
  -t "build: merge release ${release_version} to develop" \
  -b ""

# Create new GitHub release from release tag
gh release create ${release_version} \
  --generate-notes