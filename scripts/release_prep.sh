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
release_version_num=$(jq -r .version < package.json)
release_version="v${release_version}"
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

# Extract changelog to inject into the PR
pr_body_working=.pr_body_working_${release_version}
pr_body_actual=.pr_body_actual_${release_version}

awk "
  /^## \[${release_version}\]/ { flag=1; next }
  /^## \[/ { flag=0 }
  /^### Changelog$/ { flag=0 }
  flag
" CHANGELOG.md > "${pr_body_working}"

# Start the actual PR body with the full changelog section
cp "${pr_body_working}" "${pr_body_actual}"

# Build a filtered view of the changelog that EXCLUDES the Dependencies / Dev-Dependencies
# sections. This ensures we only derive tests from feature/fix PRs, not dependency bumps.
pr_body_for_tests=.pr_body_tests_${release_version}
awk '
  # When we hit the Dependencies or Dev-Dependencies headings, start skipping lines
  /^### Dependencies$/      { skip=1; next }
  /^### Dev-Dependencies$/  { skip=1; next }
  # When we hit the next top-level "### <Section>" heading after that, stop skipping
  /^### [A-Z]/ && skip==1   { skip=0 }
  # Emit lines only when we are not skipping
  !skip
' "${pr_body_working}" > "${pr_body_for_tests}"

# Append an overall "Tests" heading at the end of the PR body, under which we will
# aggregate the per-PR test plans.
echo "" >> "${pr_body_actual}"
echo "### Tests" >> "${pr_body_actual}"
echo "" >> "${pr_body_actual}"

# For each non-deps bullet line that references a PR, fetch that PR's Tests
# section and append it under a heading derived from the changelog line.
grep '^[*] ' "${pr_body_for_tests}" | \
grep '\[#\([0-9]\+\)\](' | \
while read -r line_item; do
  # Extract first PR number on the line, e.g. "#9183" or "[#9183](...)"
  pr_id=$(echo "${line_item}" | grep -o -E '#[0-9]+' | head -n1 | tr -d '#')
  [[ -z "${pr_id}" ]] && continue

  # Fetch the PR body and slice out only its "Tests" section (from the Tests heading
  # until the next top-level heading), then normalize checkboxes and bump heading
  # levels so nested headings render nicely inside the release PR body.
  tests=$(gh pr view "${pr_id}" | \
    awk '
      /^##+ Tests?/      { f=1; next }
      /^##+ [A-Z]/ && f  { f=0 }
      f
    ' | \
    sed -E "s/\[[Xx]\]/[ ]/" | \
    sed -E "s/^(##+) /\1## /")

  if [[ ${tests} =~ [^[:space:]] ]]; then
    # Use the changelog bullet as a subheading for this PR's tests
    echo "${line_item}" | sed "s/^\* /### /" >> "${pr_body_actual}"
    # Then append the normalized Tests section from the PR body
    echo "${tests}" >> "${pr_body_actual}"
    echo "" >> "${pr_body_actual}"
  fi
done

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
rm "${pr_body_working}" "${pr_body_actual}" "${pr_body_for_tests}"
git checkout feat/build-script
git branch -D ${release_branch}
