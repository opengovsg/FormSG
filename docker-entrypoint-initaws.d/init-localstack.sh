#!/bin/bash
set -x
awslocal s3 mb s3://$IMAGE_S3_BUCKET
awslocal s3 mb s3://$LOGO_S3_BUCKET
awslocal s3 mb s3://$ATTACHMENT_S3_BUCKET
set +x