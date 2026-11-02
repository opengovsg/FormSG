#!/usr/bin/env bash

# aws-lambda-ric 4 reads the handler from _HANDLER and the app root from
# LAMBDA_TASK_ROOT instead of argv; v2 took the handler from argv and used the
# working directory. Lambda only sets _HANDLER from the image CMD, which this
# image does not have, and the RIE sets it from its own args. Export both here
# so the handler passed to this script works under the RIE and on Lambda.
export LAMBDA_TASK_ROOT="$PWD"
export _HANDLER="${_HANDLER:-$1}"

if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
  # We know the image is being run off of Lambda, so we need to use the RIE
  # to start the function.
  exec /usr/bin/aws-lambda-rie ./node_modules/.bin/aws-lambda-ric $1
else
  # We know the image is being run on Lambda so we don't need to use the RIE.
  exec ./node_modules/.bin/aws-lambda-ric $1
fi
