#!/bin/bash
set -x
until $(curl --output /dev/null --silent --head --fail $AWS_ENDPOINT); do
  printf 'Waiting for Localstack to be ready...'
  sleep 5
done
awslocal --endpoint-url=$AWS_ENDPOINT s3 mb s3://$IMAGE_S3_BUCKET
awslocal --endpoint-url=$AWS_ENDPOINT s3 mb s3://$LOGO_S3_BUCKET
awslocal --endpoint-url=$AWS_ENDPOINT s3 mb s3://$ATTACHMENT_S3_BUCKET
set +x