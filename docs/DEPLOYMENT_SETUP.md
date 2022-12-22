# Deployment Setup

This document details what is needed to create an environment to run FormSG in AWS.

## Build and run your NodeJS app

```bash
npm install
$ npm run build
$ npm start
```

## Deploying to AWS Elastic Beanstalk

Make sure you have created an AWS cloud environment as a prerequisite. Some of the services used are listed below:

Infrastructure

- AWS Elastic Beanstalk / EC2 for hosting and deployment
- AWS Elastic File System for mounting files (i.e. SingPass/MyInfo private keys into the `/certs` directory)
- AWS S3 for image and logo hosting, attachments for Storage Mode forms
- AWS Service Manager - Parameter Store, for holding environment variable configuration

DevOps

- Github Actions for running tests and builds
- AWS Elastic Container Registry to host built Docker images

Network

- AWS VPC (with peering preferred) for managed database hosted by MongoDB Atlas
- AWS NAT Gateway (for static IP whitelisting with SingPass)

Database

- MongoDB instance (we use Mongo Atlas)

Emails

- AWS Simple Email Service with SMTP integration for sending emails to login/send OTPs/form submissions/submission autoreplies

SMS

- Twilio for sending OTPs
- AWS Secrets Manager (to manage user-provided or hosted Twilio credentials)

Analytics and Monitoring

- Sentry.io
- Google Analytics

Spam protection

- Google reCAPTCHA

### Mounting Elastic File System into Docker container on Elastic Beanstalk

Please see [Dockerrun.aws.json](../Dockerrun.aws.json). This file is required for SingPass/MyInfo/CorpPass functionality to be enabled.

### Secrets Manager (Optional)

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

### Github Actions Secrets

The following repository secrets are set in Github Actions:
| Secret | Description|
|:---------|------------|
|`AWS_ACCESS_KEY_ID`|AWS IAM access key ID used to deploy.|
|`AWS_SECRET_ACCESS_KEY`|AWS IAM access secret used to deploy.|
|`AWS_DEFAULT_REGION`|AWS region to use.|
|`ECR_REPO`|ECR Repository which stores the docker images.|
|`BUCKET_NAME`| S3 Bucket used to store zipped `Dockerrun.aws.json`.|

There are also environment secrets for each environment (`staging`, `staging-alt`, `release`, `uat`):
| Secret | Description|
|:---------|------------|
|`APP_NAME`|Application name for the environment.|
|`DEPLOY_ENV`|Deployment environment on elastic beanstalk.|
|`REACT_APP_FORMSG_SDK_MODE`|Determines the keys used in the formsg SDK. Set either `production` or `staging`.|

## Environment Variables

These are configured by creating groups of environment variables formatted like `.env` files in the Parameter
Store of AWS Service Manager. These groups have names formatted as `<environment>-<category>`.

The environment for each group is user-defined, and should be specified in the Elastic Beanstalk configuration
as the environment variable `SSM_PREFIX`.

The list of categories can be inferred by looking at the file `.ebextensions/env-file-creation.config`.

### Core Features

#### AWS Service Manager

| Variable     | Description                                                                                                           |
| :----------- | --------------------------------------------------------------------------------------------------------------------- |
| `SSM_PREFIX` | String prefix (typically the environment name) for AWS SSM parameter names to create a .env file for FormSG.          |
| `SECRET_ENV` | String (typically the environment name) to be used in building of AWS Secrets Manager keys in different environments. |

#### App Config

| Variable            | Description                                                                                                      |
| :------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `APP_NAME`          | Application name in window title; also used as an identifier for MyInfo. Defaults to `'FormSG'`.                 |
| `APP_DESC`          | Defaults to `'Form Manager for Government'`.                                                                     |
| `APP_URL`           | Defaults to `'https://form.gov.sg'`.                                                                             |
| `APP_KEYWORDS`      | Defaults to `'forms, formbuilder, nodejs'`.                                                                      |
| `APP_IMAGES`        | Defaults to `'/public/modules/core/img/og/img_metatag.png,/public/modules/core/img/og/logo-vertical-color.png'`. |
| `APP_TWITTER_IMAGE` | Path to Twitter image. Defaults to `'/public/modules/core/img/og/logo-vertical-color.png'`.                      |

#### App and Database

| Variable             | Description                                                                                                                                                                                                |
| :------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DB_HOST`            | A MongoDB URI.                                                                                                                                                                                             |
| `OTP_LIFE_SPAN`      | Time in milliseconds that admin login OTP is valid for. Defaults to 900000ms or 15 minutes.                                                                                                                |
| `PORT`               | Server port. Defaults to `5000`.                                                                                                                                                                           |
| `NODE_ENV`           | [Express environment mode](https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production). Defaults to `'production'`. This should always be set to a production environment |
| `SESSION_SECRET`     | Secret for `express-session` for session management. This should always be set to a secret and random value in a production environment.                                                                   |
| `SUBMISSIONS_TOP_UP` | Use this to inflate the number of submissions displayed on the landing page. Defaults to `0`.                                                                                                              |

#### Banners

These environment variables allow us to set notification banners in the
application without a full redeployment of the application. Note the hierarchy
of the banner content.

In addition, you can change the color of the banner by adding a type encoding in
the environment variable string. The default banner type will be `info` if no encoding is
provided.

The possible banner type prefixes are: `info:`, `warn:`, and `error:`. Other
prefixes will not work and the invalid prefixes will be shown in the banner
text.

Examples:

```
SITE_BANNER_CONTENT=info:This is an info banner. You can also add links in the text like https://example.com. There is also a dismiss button to the right of the text.
```

![Info banner
example](https://user-images.githubusercontent.com/22133008/93852946-8a867780-fce5-11ea-929f-a0ce1c6796b9.png)

```
SITE_BANNER_CONTENT=warn:This is a warning banner. You can also add links in the text like https://example.com
```

![Warning banner example](https://user-images.githubusercontent.com/22133008/93852559-cec54800-fce4-11ea-9376-9b2802e8ac62.png)

```
SITE_BANNER_CONTENT=error:This is an error banner. You can also add links in the text like https://example.com
```

![Error banner example](https://user-images.githubusercontent.com/22133008/93852689-1055f300-fce5-11ea-956d-d5966cbe86d8.png)

```
SITE_BANNER_CONTENT=hello:This is an invalid banner type, and the full text will be shown. The default banner type of `info` will used.
```

![Invalid banner default example](https://user-images.githubusercontent.com/22133008/93853306-392ab800-fce6-11ea-9891-f752bdad236e.png)

| Variable                 | Description                                                                                                                                                                                                   |
| :----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_BANNER_CONTENT`    | If set, displays a banner message on both private routes that `ADMIN_BANNER_CONTENT` covers **and** public form routes that `IS_GENERAL_MAINTENANCE` covers. Overrides all other banner environment variables |
| `ADMIN_BANNER_CONTENT`   | If set, displays a banner message on private admin routes such as the form list page as well as form builder pages.                                                                                           |
| `IS_LOGIN_BANNER`        | If set, displays a banner message on the login page.                                                                                                                                                          |
| `IS_GENERAL_MAINTENANCE` | If set, displays a banner message on all forms. Overrides `IS_SP_MAINTENANCE` and `IS_CP_MAINTENANCE`.                                                                                                        |
| `MYINFO_BANNER_CONTENT`  | all public **MyInfo-enabled** forms                                                                                                                                                                           |
| `IS_SP_MAINTENANCE`      | all public **SingPass-enabled** forms                                                                                                                                                                         |
| `IS_CP_MAINTENANCE`      | all public **CorpPass-enabled** forms                                                                                                                                                                         |

> Note that if more than one of the above environment variables are defined,
> only one environment variable will be used to display the given values.
>
> For public form routes, only one environment variable will be read in the
> following precedence: `SITE_BANNER_CONTENT` > `IS_GENERAL_MAINTENANCE` >
> `IS_SP_MAINTENANCE` > `IS_CP_MAINTENANCE`
>
> For private form routes, only one environment variable will be read in the
> following precendence: `SITE_BANNER_CONTENT` > `ADMIN_BANNER_CONTENT`
>
> For the login page, only one environment variable will be read in the
> following precendence: `SITE_BANNER_CONTENT` > `IS_LOGIN_BANNER`

#### AWS services

| Variable                      | Description                                                                                                                         |
| :---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `AWS_REGION`                  | AWS region.                                                                                                                         |
| `AWS_ACCESS_KEY_ID`           | AWS IAM access key ID used to access S3.                                                                                            |
| `AWS_SECRET_ACCESS_KEY`       | AWS IAM access secret used to access S3.                                                                                            |
| `AWS_ENDPOINT`                | AWS S3 bucket endpoint.                                                                                                             |
| `IMAGE_S3_BUCKET`             | Name of S3 bucket for image field uploads.                                                                                          |
| `STATIC_ASSETS_S3_BUCKET`     | Name of S3 bucket for static assets.                                                                                                |
| `LOGO_S3_BUCKET`              | Name of S3 bucket for form logo uploads.                                                                                            |
| `ATTACHMENT_S3_BUCKET`        | Name of S3 bucket for attachment uploads on Storage Mode.                                                                           |
| `CUSTOM_CLOUDWATCH_LOG_GROUP` | Name of CloudWatch log group to send custom logs. Use this if you want some logs to have custom settings, e.g. shorter expiry time. |

#### [FormSG JavaScript SDK](https://www.npmjs.com/package/@opengovsg/formsg-sdk)

| Variable          | Description                           |
| :---------------- | ------------------------------------- |
| `FORMSG_SDK_MODE` | The mode to instantiate the sdk with. |

#### Email and Nodemailer

| Variable              | Description                                                                                                                                                                                                          |
| :-------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SES_HOST`            | SMTP hostname.                                                                                                                                                                                                       |
| `SES_PORT`            | SMTP port number.                                                                                                                                                                                                    |
| `SES_USER`            | SMTP username.                                                                                                                                                                                                       |
| `SES_PASS`            | SMTP password.                                                                                                                                                                                                       |
| `SES_MAX_MESSAGES`    | Nodemailer configuration. Connection removed and new one created when this limit is reached. This helps to keep the connection up-to-date for long-running email messaging. Defaults to `100`.                       |
| `SES_POOL`            | Connection pool to send email in parallel to the SMTP server. Defaults to `38`.                                                                                                                                      |
| `MAIL_FROM`           | Sender email address. Defaults to `'donotreply@mail.form.gov.sg'`.                                                                                                                                                   |
| `MAIL_SOCKET_TIMEOUT` | Milliseconds of inactivity to allow before killing a connection. This helps to keep the connection up-to-date for long-running email messaging. Defaults to `600000`.                                                |
| `MAIL_LOGGER`         | If set to true then logs to console. If value is not set or is false then nothing is logged.                                                                                                                         |
| `MAIL_DEBUG`          | If set to `true`, then logs SMTP traffic, otherwise logs only transaction events.                                                                                                                                    |
| `CHROMIUM_BIN`        | Filepath to chromium binary. Required for email autoreply PDF generation with Puppeteer.                                                                                                                             |
| `BOUNCE_LIFE_SPAN`    | Time in milliseconds that bounces are tracked for each form. Defaults to 86400000ms or 24 hours. Only relevant if you have set up AWS to send bounce and delivery notifications to the /emailnotifications endpoint. |

#### Rate limits at specific endpoints

The app applies per-minute, per-IP rate limits at specific API endpoints as a security measure. The limits can be specified with the following environment variables.
| Variable | Description |
| :-------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUBMISSIONS_RATE_LIMIT` | Per-minute, per-IP request limit for each submissions endpoint. The limit is applied separately for the email mode and encrypt mode endpoints. |
| `SEND_AUTH_OTP_RATE_LIMIT` | Per-minute, per-IP request limit for the endpoint which requests for new login OTPs for the admin console or mobile / email field verifications. |

### Additional Features

The app contains a number of additional features like Captcha protection, Sentry reporting and Google Analytics. Each of these features requires specific environment variables which are detailed below.

#### Google Captcha

Forms can be protected with [recaptcha](https://www.google.com/recaptcha/about/), preventing submissions from being made by bots.

| Variable                | Description                |
| :---------------------- | -------------------------- |
| `GOOGLE_CAPTCHA`        | Google Captcha private key |
| `GOOGLE_CAPTCHA_PUBLIC` | Google Captcha public key. |

#### Google Analytics

[Google Analytics](https://analytics.google.com/analytics/web) is used to track website traffic. Examples of events include number of visits to various forms, number of successful submissions and number of submission failures.

| Variable                   | Description                   |
| :------------------------- | ----------------------------- |
| `REACT_APP_GA_TRACKING_ID` | Google Analytics tracking ID. |

#### Sentry.io

Client-side error events are piped to [sentry.io](https://sentry.io/welcome/) for monitoring purposes.

| Variable            | Description                                                                                           |
| :------------------ | ----------------------------------------------------------------------------------------------------- |
| `CSP_REPORT_URI`    | Reporting URL for Content Security Policy violdations. Can be configured to use a Sentry.io endpoint. |
| `SENTRY_CONFIG_URL` | Sentry.io URL for configuring the Raven SDK.                                                          |
| `CSP_REPORT_URI`    | Reporting URL for Content Security Policy violdations. Can be configured to use a Sentry.io endpoint. |

#### SMS with Twilio

The Mobile Number field supports form-fillers verifying their mobile numbers via a One-Time-Pin sent to their mobile phones. All messages are sent using [Twilio](https://www.twilio.com/) messaging APIs.

Note that verifying mobile numbers also requires the environment variables for [verified Emails/SMSes](#verified-emailssmses).

| Variable                       | Description              |
| :----------------------------- | ------------------------ |
| `TWILIO_ACCOUNT_SID`           | Twilio messaging ID.     |
| `TWILIO_API_KEY`               | Twilio standard API Key. |
| `TWILIO_API_SECRET`            | Twilio API Secret.       |
| `TWILIO_MESSAGING_SERVICE_SID` | Messaging service ID.    |

#### SingPass/CorpPass and MyInfo

Submissions can be authenticated via [SingPass](https://www.singpass.gov.sg/singpass/common/aboutus) (Singapore's Digital Identity for Citizens) and
[CorpPass](https://www.corppass.gov.sg/corppass/common/aboutus) (Singapore's Digital Identity for Organizations). Forms can also be pre-filled using [MyInfo](https://www.singpass.gov.sg/myinfo/intro) after a citizen has successfully authenticated using SingPass.

Note that MyInfo is currently not supported for storage mode forms and enabling SingPass/CorpPass on storage mode forms also requires [SingPass/CorpPass for Storage Mode](#webhooks-and-singpasscorppass-for-storage-mode) to be enabled.

| Variable                         | Description                                                                                                                                                                                     |
| :------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SPCP_COOKIE_MAX_AGE_PRESERVED`  | Duration of SingPass JWT before expiry in milliseconds. Defaults to 30 days.                                                                                                                    |
| `SINGPASS_ESRVC_ID`              | e-service ID registered with National Digital Identity office for SingPass authentication. Needed for MyInfo.                                                                                   |
| `SP_OIDC_NDI_DISCOVERY_ENDPOINT` | NDI's Singpass OIDC Discovery Endpoint                                                                                                                                                          |
| `SP_OIDC_NDI_JWKS_ENDPOINT`      | NDI's Singpass OIDC JWKS Endpoint                                                                                                                                                               |
| `SP_OIDC_RP_CLIENT_ID`           | The Relying Party's Singpass Client ID as registered with NDI                                                                                                                                   |
| `SP_OIDC_RP_REDIRECT_URL`        | The Relying Party's Singpass Redirect URL                                                                                                                                                       |
| `SP_OIDC_RP_JWKS_PUBLIC_PATH`    | Path to the Relying Party's Public Json Web Key Set used for Singpass-related communication with NDI. This will be hosted at /singpass/.well-known/jwks.json endpoint.                          |
| `SP_OIDC_RP_JWKS_SECRET_PATH`    | Path to the Relying Party's Secret Json Web Key Set used for Singpass-related communication with NDI                                                                                            |
| `CP_OIDC_NDI_DISCOVERY_ENDPOINT` | NDI's Corppass OIDC Discovery Endpoint                                                                                                                                                          |
| `CP_OIDC_NDI_JWKS_ENDPOINT`      | NDI's Corppass OIDC JWKS Endpoint                                                                                                                                                               |
| `CP_OIDC_RP_CLIENT_ID`           | The Relying Party's Corppass Client ID as registered with NDI                                                                                                                                   |
| `CP_OIDC_RP_REDIRECT_URL`        | The Relying Party's Corppass Redirect URL                                                                                                                                                       |
| `CP_OIDC_RP_JWKS_PUBLIC_PATH`    | Path to the Relying Party's Public Json Web Key Set used for Corppass-related communication with NDI. This will be hosted at api/v3/corppass/.well-known/jwks.json endpoint.                    |
| `CP_OIDC_RP_JWKS_SECRET_PATH`    | Path to the Relying Party's Secret Json Web Key Set used for Corppass-related communication with NDI                                                                                            |
| `MYINFO_CLIENT_CONFIG`           | Configures [MyInfoGovClient](https://github.com/opengovsg/myinfo-gov-client). Set this to either`stg` or `prod` to fetch MyInfo data from the corresponding endpoints.                          |
| `MYINFO_FORMSG_KEY_PATH`         | Filepath to MyInfo private key, which is used to decrypt data and sign requests when communicating with MyInfo.                                                                                 |
| `MYINFO_CERT_PATH`               | Path to MyInfo's public certificate, which is used to verify their signature.                                                                                                                   |
| `MYINFO_CLIENT_ID`               | Client ID registered with MyInfo.                                                                                                                                                               |
| `MYINFO_CLIENT_SECRET`           | Client secret registered with MyInfo.                                                                                                                                                           |
| `MYINFO_JWT_SECRET`              | Secret for signing MyInfo JWT.                                                                                                                                                                  |
| `IS_SP_MAINTENANCE`              | If set, displays a banner message on SingPass forms. Overrides `IS_CP_MAINTENANCE`.                                                                                                             |
| `IS_CP_MAINTENANCE`              | If set, displays a banner message on CorpPass forms.                                                                                                                                            |
| `FILE_SYSTEM_ID`                 | The id of the AWS Elastic File System (EFS) file system to mount onto the instances.                                                                                                            |
| `CERT_PATH`                      | The specific directory within the network file system that is to be mounted. This directory is expected to contain the public certs and private keys relevant to SingPass, CorpPass and MyInfo. |

#### Verified Emails/SMSes

The Mobile Number and Email fields support form-fillers verifying their contact details via a One-Time-Pin.

Note that verified SMSes also require [SMS with Twilio](#sms-with-twilio) to be enabled.

| Variable                  | Description                                                    |
| :------------------------ | -------------------------------------------------------------- |
| `VERIFICATION_SECRET_KEY` | The secret key for signing verified responses (email, mobile). |

#### Webhooks and SingPass/CorpPass for Storage Mode

Form admins can configure their Storage mode forms to POST encrypted form submissions to a REST API supplied by the form creator. The [FormSG SDK](https://github.com/opengovsg/formsg-javascript-sdk) can then be used to verify the signed posted data and decrypt the encrypted submission contained within.

These environment variables also allow Storage mode forms to support authentication via SingPass or CorpPass. Note that this also requires [SingPass/CorpPass and MyInfo](#singpasscorppass-and-myinfo) to be enabled.

| Variable             | Description                                                           |
| :------------------- | --------------------------------------------------------------------- |
| `SIGNING_SECRET_KEY` | The secret key for signing verified content passed into the database. |

### Tests

| Variable                   | Description                                                                                                                                     |
| :------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGO_BINARY_VERSION`     | Version of the Mongo binary used. Defaults to `'latest'` according to [MongoMemoryServer](https://github.com/nodkz/mongodb-memory-server) docs. |
| `PWD`                      | Path of working directory.                                                                                                                      |
| `MOCK_WEBHOOK_CONFIG_FILE` | Path of configuration file for mock webhook server                                                                                              |
| `MOCK_WEBHOOK_PORT`        | Port of mock webhook server                                                                                                                     |
