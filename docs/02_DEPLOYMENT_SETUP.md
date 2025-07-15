# Deployment Setup

This document details what is needed to create an environment to run FormSG in AWS.

## Running Locally
See our [quickstart guide](./01_QUICKSTART.md).

## Deploying to AWS

Make sure you have created an AWS cloud environment as a prerequisite. Some of the services used are listed below:

### Infrastructure

- AWS ECS (Elastic Container Service) - *Current deployment target* for container orchestration
- AWS S3 for image and logo hosting, attachments for Storage Mode forms
- AWS Systems Manager - Parameter Store, for holding environment variable configuration
- ~~AWS Elastic Beanstalk~~ - *Legacy deployment method, being phased out*

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
All messages are sent using [Postman](https://postman-v2.guides.gov.sg/), a government communications service developed by the Open Government Products team.
This Postman service (not to be confused with the popular API client of the same name) is specifically designed for Singapore government agencies to send SMS messages to citizens and businesses. It provides campaign management, delivery tracking, and compliance with government communication standards.

See what alternatives you can use in [build your own infra](./05_BYOI.md) section.

### Analytics and Monitoring

- Datadog for application monitoring, metrics collection, and alerting

### Spam protection

- Google reCAPTCHA

### Mounting Elastic File System into Docker container on Elastic Beanstalk
Please see [Dockerrun.aws.json](../Dockerrun.aws.json). This file is required for SingPass/MyInfo/CorpPass functionality to be enabled.
