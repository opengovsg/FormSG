#!/bin/bash
set -x
until $(curl --output /dev/null --silent --head --fail http://localhost:4572); do
  printf 'Waiting for Localstack to be ready...'
  sleep 5
done
awslocal --endpoint-url=http://localhost:4572 s3 mb s3://$IMAGE_S3_BUCKET
awslocal --endpoint-url=http://localhost:4572 s3 mb s3://$LOGO_S3_BUCKET
awslocal --endpoint-url=http://localhost:4572 s3 mb s3://$ATTACHMENT_S3_BUCKET
set +x