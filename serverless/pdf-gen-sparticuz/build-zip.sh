#!/bin/bash
# This script is used to build a fresh dist and zip file with only the necessary files for the lambda function zip deployment.

# Clean and remove any existing dist directory so we can start from scratch
rm -rf dist/
rm -f pdf-gen-sparticuz.zip

# Create a new dist directory
mkdir -p dist/

# Copy the necessary files for building to the dist directory (This includes the fonts, package.json, package-lock.json)
cp -r fonts/ dist/fonts/
cp package.json dist/
cp package-lock.json dist/

# Build the ts files in src/ into the /dist directory using esbuild
npm run build-ts-dist 

# The necessary files are now in the dist directory - begin building the zip file contents
cd dist 
# # Install dev dependencies only in node_modules in the dist directory
npm ci --omit=dev 

# # Zip the dist directory into a zip file called pdf-gen-sparticuz.zip
zip -r ../pdf-gen-sparticuz.zip ./*