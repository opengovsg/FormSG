#!/usr/bin/env bash
# Regenerates the Chainguard lockfile from the public pnpm-lock.yaml.
# Requires: chainctl logged in to open.gov.sg. Run from repo root.
set -euo pipefail

if ! command -v chainctl >/dev/null 2>&1; then
  echo "chainctl not found. Install: brew install chainctl" >&2
  exit 1
fi

echo "Copying public lockfile -> pnpm-lock.cgr.yaml"
cp pnpm-lock.yaml pnpm-lock.cgr.yaml

echo "Rewriting registry + integrity hashes via Chainguard"
chainctl libraries update-hashes --replace pnpm-lock.cgr.yaml

echo "Done. Inspect the diff with https://andrewd-cg.github.io/npm-lock-file-inspector/"
echo "Expect every resolution to point at libraries.cgr.dev."
