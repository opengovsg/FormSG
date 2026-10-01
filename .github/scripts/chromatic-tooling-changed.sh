#!/usr/bin/env bash
# Usage: chromatic-tooling-changed.sh <importer> <base-rev>
# Writes changed=true|false to $GITHUB_OUTPUT: whether any build-tooling package
# locked for <importer> in pnpm-lock.yaml differs between <base-rev> and HEAD.
#
# TurboSnap traces a changed dependency through the node_modules modules in the
# Storybook bundle. Build tooling runs in Node and is never bundled, so a bump
# traces to zero stories even though it can change every snapshot. The workflow
# turns TurboSnap off when this reports a change.
#
# ponytail: compares direct dependencies only. A transitive-only bump (e.g. esbuild
# under an unchanged vite) slips through; diff the packages section if that bites.
set -euo pipefail

importer=$1
base=$2
# Packages that change how stories render without being modules in the bundle:
# Storybook itself, vite and its plugins (Storybook loads vite.config.ts), React
# and Chakra (rendered by every story).
TOOLING='^(storybook|@storybook/.+|vite|vite-plugin-.+|vite-tsconfig-paths|@vitejs/.+|react|react-dom|@chakra-ui/.+)$'

# "<name> <version>" for each direct dependency of $importer at <rev>. An
# unreadable lockfile prints nothing, so every tooling package counts as changed.
versions() {
  git show "$1:pnpm-lock.yaml" 2>/dev/null | awk -v importer="  $importer:" '
    $0 == importer { found = 1; next }
    found && /^  [^ ]/ { exit }
    found && /^      [^ ]/ { name = $1; sub(/:$/, "", name); gsub(/\047/, "", name) }
    found && /^        version:/ { print name, $2 }
  ' | sort || true
}

changed=$(comm -3 <(versions "$base") <(versions HEAD) | awk '{ print $1 }' |
  grep -E "$TOOLING" | sort -u || true)

if [ -n "$changed" ]; then
  echo "Build tooling changed since $base, disabling TurboSnap:"
  echo "$changed"
  echo changed=true >>"$GITHUB_OUTPUT"
else
  echo changed=false >>"$GITHUB_OUTPUT"
fi
