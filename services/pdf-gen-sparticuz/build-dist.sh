#!/bin/bash
# This script is used to build a fresh dist directory for SAM deployment

# Clean and remove any existing dist directory so we can start from scratch
rm -rf dist/

# Create a new dist directory
mkdir -p dist/

# Copy the necessary files for building to the dist directory (This includes the fonts, package.json)
cp -r fonts/ dist/fonts/
cp package.json dist/

# Build the ts files in src/ into the /dist directory using esbuild
pnpm run build-ts-dist

# Install production dependencies in the dist directory (including @sparticuz/chromium with required .br binaries)
# Create an empty pnpm-workspace.yaml to isolate from the monorepo workspace,
# otherwise pnpm walks up and treats dist/ as part of the monorepo.
touch dist/pnpm-workspace.yaml
cd dist
pnpm install -P
rm -f pnpm-workspace.yaml pnpm-lock.yaml

echo "⚡ Build completed successfully in the /dist directory. Run 'pnpm run sam-build' to build the SAM package."
