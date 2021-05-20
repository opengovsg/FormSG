#!/bin/bash
# Wait for all Localstack services to be ready
while [[ "$(curl -s -f http://localhost:4566/health | jq '[.services[] == "running"] | all')" != "true" ]]; do
  sleep 5
done
set -x
# Create S3 buckets
awslocal s3 mb s3://$IMAGE_S3_BUCKET
awslocal s3 mb s3://$LOGO_S3_BUCKET
awslocal s3 mb s3://$ATTACHMENT_S3_BUCKET

# Create SQS queue for webhooks
# Extract queue name, which is the part of the queue URL after the final "/"
awslocal sqs create-queue --queue-name ${WEBHOOK_SQS_URL##*/} --attributes '{
    "ReceiveMessageWaitTimeSeconds": "20"
}'

set +x
