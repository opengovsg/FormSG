#!/bin/bash
# Usage: generate_pr_body.sh <version_num> [changelog_file]
#   version_num    - bare tag version number, e.g. 6.314.0 (no "v" prefix)
#   changelog_file - path to changelog (default: CHANGELOG.md)
#
# Outputs the PR body to stdout. Use redirection to save to a file:
#   ./scripts/generate_pr_body.sh 6.314.0 > .pr_body_release
#   ./scripts/generate_pr_body.sh 6.314.0 path/to/CHANGELOG.md > .pr_body_release

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <version_num> [changelog_file]" >&2
  echo "  e.g. $0 6.314.0" >&2
  echo "  e.g. $0 6.314.0 path/to/CHANGELOG.md" >&2
  exit 1
fi

release_version="$1"
changelog_file="${2:-CHANGELOG.md}"

if [[ ! -f "${changelog_file}" ]]; then
  echo "Error: changelog file not found: ${changelog_file}" >&2
  exit 1
fi

pr_body_working=".pr_body_working_${release_version}"
pr_body_for_tests=".pr_body_tests_${release_version}"

cleanup() {
  rm -f "${pr_body_working}" "${pr_body_for_tests}"
}
trap cleanup EXIT

# Extract the changelog section for this version into a temp file
awk "
  /^## \[${release_version}\]/ { flag=1; next }
  /^## \[/ { flag=0 }
  /^### Changelog$/ { flag=0 }
  flag
" "${changelog_file}" > "${pr_body_working}"

# Build a filtered view that EXCLUDES the Dependencies / Dev-Dependencies / Build System
# sections. This ensures we only derive tests from feature/fix PRs, not dependency bumps.
awk '
  # When we hit the skipped headings, start skipping lines
  /^### Dependencies$/      { skip=1; next }
  /^### Dev-Dependencies$/  { skip=1; next }
  /^### Builds$/            { skip=1; next }
  # When we hit the next top-level "### <Section>" heading after that, stop skipping
  /^### [A-Z]/ && skip==1   { skip=0 }
  # Emit lines only when we are not skipping
  !skip
' "${pr_body_working}" > "${pr_body_for_tests}"

# Output the full changelog section first
cat "${pr_body_working}"

# Append an overall "Tests" heading, under which we will aggregate the per-PR test plans
echo ""
echo "### Tests"
echo ""

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
    echo "${line_item}" | sed "s/^\* /### /"
    # Then append the normalized Tests section from the PR body
    echo "${tests}"
    echo ""
  fi
done
