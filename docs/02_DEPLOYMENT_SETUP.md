# Deployment Setup

This document details what is needed to create an environment to run FormSG in AWS.

## Running Locally
See our [quickstart guide](./01_QUICKSTART.md).

## Deploying to AWS

Make sure you have created an AWS cloud environment as a prerequisite. Some of the services used are listed below:

### Infrastructure

<!-- TODO: change to AWS ECS, keep content as-is for now -->
- AWS Elastic Beanstalk / EC2 for hosting and deployment
- AWS Elastic File System for mounting files (i.e. SingPass/MyInfo private keys into the `/certs` directory)
- AWS S3 for image and logo hosting, attachments for Storage Mode forms
- AWS Systems Manager - Parameter Store, for holding environment variable configuration

### DevOps

- Github Actions for running tests and builds
- AWS Elastic Container Registry to host built Docker images

### Network

- AWS VPC (with peering preferred) for managed database hosted by MongoDB Atlas
- AWS NAT Gateway (for static IP whitelisting with SingPass)

### Database

- MongoDB instance (we use [Mongo Atlas](https://www.mongodb.com/products/platform/atlas-database))

### Emails

- AWS Simple Email Service with SMTP integration for sending emails to login/send OTPs/form submissions/submission autoreplies

### SMS
<!-- TODO: check if AWS Secrets manager is still used. Twilio -> Postman migration happened in jul'24 -->
- Postman for sending OTPs for verified phone number fields
- AWS Secrets Manager (to manage Postman credentials)

### Analytics and Monitoring

- Google Analytics

### Spam protection

- Google reCAPTCHA

### Mounting Elastic File System into Docker container on Elastic Beanstalk
<!-- TODO: are we still using Dockerrun on ECS? need to check with formsg-infra -->
Please see [Dockerrun.aws.json](../Dockerrun.aws.json). This file is required for SingPass/MyInfo/CorpPass functionality to be enabled.

### Secrets Manager (Optional)
<!-- TODO: update with Postman instructions -->
FormSG supports storing of users' Twilio API credentials using AWS Secret Manager. There is currently no user interface for form administrators to upload their Twilio API credentials and this has to be done manually using the AWS console by developers.

Firstly, name the secret with a unique secret name and store the secret value in the following format:

```json
{
  "accountSid": "<redacted>",
  "apiKey": "<redacted>",
  "apiSecret": "<redacted>",
  "messagingServiceSid": "<redacted>"
}
```

Secondly, edit the form document belonging to that specific form adminstrator by adding a `msgSrvcName` key and setting it to the secret name you just stored.

If no `msgSrvcName` is found in the form document, SMSes associated with that form will be sent out using and charged to the default Twilio API credentials.
