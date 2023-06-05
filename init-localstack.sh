#!/bin/bash
# Wait for all Localstack services to be ready
while [[ "$(curl -s -f http://localhost:4566/health | jq '[.services[] == "running"] | all')" != "true" ]]; do
  sleep 5
done

# Create SQS queue for webhooks
# First create dead-letter queue and get its ARN so it can be specified as the DLQ
# for the main queue. Note that the DLQ name is not an environment variable
# in the application, as this is configured from the AWS console in production.
DLQ_NAME=local-webhooks-sqs-deadLetter
DLQ_URL=$(awslocal sqs create-queue --queue-name $DLQ_NAME | jq --raw-output '.QueueUrl')
DLQ_ARN=$(awslocal sqs get-queue-attributes --queue-url $DLQ_URL --attribute-names QueueArn | jq --raw-output '.Attributes.QueueArn')

# Show output for all main resources created
set -x

# For main queue, extract queue name, which is the part of the queue URL after the final "/"
awslocal sqs create-queue --queue-name ${WEBHOOK_SQS_URL##*/} --attributes '{
  "ReceiveMessageWaitTimeSeconds": "20",
  "RedrivePolicy": "{\"deadLetterTargetArn\":\"'"$DLQ_ARN"'\",\"maxReceiveCount\":1}"
}'

# Create S3 buckets
awslocal s3 mb s3://$IMAGE_S3_BUCKET
awslocal s3 mb s3://$LOGO_S3_BUCKET
awslocal s3 mb s3://$ATTACHMENT_S3_BUCKET
awslocal s3 mb s3://$STATIC_ASSETS_S3_BUCKET

set +x
