#!/usr/bin/env bash

# aws-lambda-ric 4 resolves the handler from LAMBDA_TASK_ROOT and refuses to
# start without it; v2 used the working directory. Keep that behaviour so the
# handler path stays relative to this directory under the RIE and on Lambda.
export LAMBDA_TASK_ROOT="$PWD"

if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
  # We know the image is being run off of Lambda, so we need to use the RIE
  # to start the function.
  exec /usr/bin/aws-lambda-rie ./node_modules/.bin/aws-lambda-ric $1
else
  # We know the image is being run on Lambda so we don't need to use the RIE.
  exec ./node_modules/.bin/aws-lambda-ric $1
fi
