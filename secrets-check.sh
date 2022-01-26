#!/bin/sh

against=HEAD

# Redirect output to stderr.
exec 1>&2

# Check changed files for an AWS keys
KEY_ID=$(git diff --cached --name-only -z $against | xargs -0 cat | perl -nle'print $& if m{(?<![A-Z0-9])[A-Z0-9]{20}(?![A-Z0-9])}')
KEY=$(git diff --cached --name-only -z $against | xargs -0 cat | perl -nle'print $& if m{(?<![A-Z0-9])[A-Z0-9]{20}(?![A-Z0-9])}')

if [ "$KEY_ID" != "" -o "$KEY" != "" ]; then
    echo "Found patterns for AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY"
    echo "Please check your code and remove API keys."
    exit 1
fi

# Normal exit
exit 0
