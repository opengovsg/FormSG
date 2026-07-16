#!/bin/bash
# Usage: generate_test_checklist.sh <version_num> [changelog_file]
#   version_num    - bare tag version number, e.g. 7.36.0 (no "v" prefix)
#   changelog_file - path to changelog (default: CHANGELOG.md)
#
# Outputs the pre-release checklist to stdout: the changelog section for this
# version, followed by a "Tests" section aggregating each feature/fix PR's test
# plan.
#
# Where this is currently used:
# - The release workflow redirects this into $GITHUB_STEP_SUMMARY so it
#   renders on the workflow run page for reviewers to verify pre production release.
#
# Requirements:
#  - `gh` authenticated (GH_TOKEN in CI) to read PR bodies.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <version_num> [changelog_file]" >&2
  echo "  e.g. $0 7.36.0" >&2
  echo "  e.g. $0 7.36.0 path/to/CHANGELOG.md" >&2
  exit 1
fi

release_version="$1"
changelog_file="${2:-CHANGELOG.md}"

if [[ ! -f "${changelog_file}" ]]; then
  echo "Error: changelog file not found: ${changelog_file}" >&2
  exit 1
fi

# Extract this version's changelog section (until the next version heading).
changelog_section=$(awk "
  /^## \[${release_version}\]/ { flag=1; next }
  /^## \[/ { flag=0 }
  /^### Changelog\$/ { flag=0 }
  flag
" "${changelog_file}")

echo "## Changelog — v${release_version}"
echo ""
printf '%s\n' "${changelog_section}"

echo ""
echo "## Tests"
echo ""

# Iterate the feature/fix bullets that reference a PR and aggregate each PR's
# Tests section. The pipeline feeding the loop drops the Dependencies /
# Dev-Dependencies / Builds sections so we only pull tests from feature/fix PRs,
# not dependency bumps. Process substitution (`< <(...)`) keeps the loop in the
# current shell, so `found_tests` survives to drive the fallback message.
found_tests=0
while read -r changelog_bullet; do
  # First PR number on the line, e.g. "#9183" or "[#9183](...)".
  pr_id=$(echo "${changelog_bullet}" | grep -o -E '#[0-9]+' | head -n1 | tr -d '#')
  [[ -z "${pr_id}" ]] && continue

  # Slice out only the PR's "Tests" section (from the Tests heading until the
  # next top-level heading), reset checkboxes to unticked, and bump heading
  # levels so nested headings render nicely inside the release summary.
  pr_tests=$(gh pr view "${pr_id}" --json body --jq .body | \
    awk '
      /^##+ Tests?/      { f=1; next }
      /^##+ [A-Z]/ && f  { f=0 }
      f
    ' | \
    sed -E "s/\[[Xx]\]/[ ]/" | \
    sed -E "s/^(##+) /\1## /")

  if [[ ${pr_tests} =~ [^[:space:]] ]]; then
    # Use the changelog bullet as a linked subheading for this PR's tests.
    echo "${changelog_bullet}" | sed "s/^\* /### /"
    echo "${pr_tests}"
    echo ""
    found_tests=1
  fi
done < <(
  printf '%s\n' "${changelog_section}" | \
  awk '
    /^### Dependencies$/      { skip=1; next }
    /^### Dev-Dependencies$/  { skip=1; next }
    /^### Builds$/            { skip=1; next }
    /^### [A-Z]/ && skip==1   { skip=0 }
    !skip
  ' | \
  grep '^[*] ' | grep '\[#\([0-9]\+\)\]('
)

if [[ "${found_tests}" -eq 0 ]]; then
  echo "_No tests found for the PRs in this release._"
fi
