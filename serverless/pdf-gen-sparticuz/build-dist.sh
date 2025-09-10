#!/bin/bash
# This script is used to build a fresh dist directory for SAM deployment

# Clean and remove any existing dist directory so we can start from scratch
rm -rf dist/

# Create a new dist directory
mkdir -p dist/

# Copy the necessary files for building to the dist directory (This includes the fonts, package.json, package-lock.json)
cp -r fonts/ dist/fonts/
cp package.json dist/
cp package-lock.json dist/

# Build the ts files in src/ into the /dist directory using esbuild
npm run build-ts-dist 

# Install dependencies in the dist directory (including @sparticuz/chromium with required .br binaries)
cd dist 
npm ci --omit=dev

echo "⚡ Build completed successfully in the /dist directory. Run 'npm run sam-build' to build the SAM package."