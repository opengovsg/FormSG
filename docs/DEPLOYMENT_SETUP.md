# Deployment Setup

This document details what is needed to create an environment to run FormSG in AWS.

## Build and run your NodeJS app

```bash
npm install
$ npm run build
$ npm start
```

## Deploying to AWS Elastic Beanstalk

As a prerequisite for EB deployment, make sure you have already created your AWS environment. Some of the services used are listed below:

- Elastic Beanstalk / EC2 for hosting and deployment
- VPC with peering to MongoDB Atlas
- NAT Gateway (for static IP whitelisting with SingPass)
- S3 for image and logo hosting
- Elastic Container Registry for built Docker images
- SES for sending emails
- EFS for mounting files e.g. SingPass/MyInfo private keys into the `/certs` directory
- Secrets Manager

### Dockerrun.aws.json

```json
{
  "AWSEBDockerrunVersion": "1",
  "Image": {
    "Name": "<AWS ECR Link>",
    "Update": "true"
  },
  "Ports": [
    {
      "ContainerPort": "4545"
    }
  ],
  "Volumes": [
    {
      "HostDirectory": "/certs",
      "ContainerDirectory": "/certs"
    }
  ]
}
```

### Secrets Manager (Optional)

FormSG supports storing of users' Twilio API credentials using AWS Secret Manager. There is currently no user interface for form administrators to upload their Twilio API credentials and this has to be done manually using the AWS console by developers.

Firstly, name the secret with a unique secret name and store the secret value in the following format:

```json
{
  "accountSid": "",
  "apiKey": "",
  "apiSecret": "",
  "messagingServiceSid": ""
}
```

Secondly, edit the form document belonging to that specific form adminstrator by adding a `msgSrvcName` key and setting it to the secret name you just stored.

If no `msgSrvcName` is found in the form document, SMSes associated with that form will be sent out using and charged to the default Twilio API credentials.

### Travis CI/CD environment variables

For more information about the various environment variables, please refer to
[Travis documentation](https://docs.travis-ci.com/user/deployment/elasticbeanstalk/).

The following env variables are set in Travis:
| Variable | Description|
|:---------|------------|
|`REPO`|The repository of the AWS ECR|
|`STAGING_BRANCH`|Name of staging branch, usually `master`.|
|`STAGING_ALT_BRANCH`|Name of staging-alt (if any) branch, usually `release`. An alternate staging branch is used to host diverging feature sets, useful for A/B testing.|
|`PROD_BRANCH`|Name of production branch, usually `release`.|
|`AWS_ACCESS_KEY_ID`|AWS IAM access key ID used to deploy.|
|`AWS_SECRET_ACCESS_KEY`|AWS IAM access secret used to deploy.|
|`AWS_REGION`|AWS region to use.|
|`PROD_APP_NAME`|The names of the deployed docker application for the production application on AWS as determined by `PROD_BRANCH`.|
|`STAGING_APP_NAME`|The names of the deployed docker application for the staging application on AWS as determined by `STAGING_BRANCH`.|
|`PROD_BUCKET_NAME`|Bucket name to upload the code of the production app to. Elastic Beanstalk will create and deploy an application version from the source bundle in this Amazon S3 bucket.|
|`STAGING_BUCKET_NAME`|Bucket name to upload the code of the staging app to. Elastic Beanstalk will create and deploy an application version from the source bundle in this Amazon S3 bucket.|
|`PROD_DEPLOY_ENV`|The name of the Elastic Beanstalk environment the production application will be deployed to.|
|`STAGING_DEPLOY_ENV`|The name of the Elastic Beanstalk environment the staging application will be deployed to.|
|`STAGING_ALT_DEPLOY_ENV`|The name of the Elastic Beanstalk environment the staging-alt application will be deployed to.|
|`SENTRY_ORG`|Organisation that source-maps should be linked to on sentry dashboard.|
|`SENTRY_AUTH_TOKEN`|Authentication token used by sentry cli to authenticate with sentry service.|
|`SENTRY_PROJECT`|Project that source-maps should be linked to on sentry dashboard.|
|`SENTRY_URL`|Sentry service that source-maps should be pushed to.|

## Environment Variables

### Core Features

#### App Config

| Variable                 | Description                                                                                                                                                                                                           |
| :----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_NAME`               | Application name in window title; also used as an identifier for MyInfo. Defaults to `'FormSG'`.                                                                                                                      |
| `APP_DESC`               | Defaults to `'Form Manager for Government'`.                                                                                                                                                                          |
| `APP_URL`                | Defaults to `'https://form.gov.sg'`.                                                                                                                                                                                  |
| `APP_KEYWORDS`           | Defaults to `'forms, formbuilder, nodejs'`.                                                                                                                                                                           |
| `APP_IMAGES`             | Defaults to `'/public/modules/core/img/og/img_metatag.png,/public/modules/core/img/og/logo-vertical-color.png'`.                                                                                                      |
| `APP_TWITTER_IMAGE`      | Path to Twitter image. Defaults to `'/public/modules/core/img/og/logo-vertical-color.png'`.                                                                                                                            |

#### App and Database

| Variable                 | Description                                                                                                                                                                                                           |
| :----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DB_HOST`                | A MongoDB URI.                                                                                                                                                                                                        |
| `OTP_LIFE_SPAN`          | Time in milliseconds that admin login OTP is valid for. Defaults to 900000ms or 15 minutes.                                                                                                                           |
| `PORT`                   | Server port. Defaults to `5000`.                                                                                                                                                                                      |
| `NODE_ENV`               | [Express environment mode](https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production). Defaults to `'development'`. This should always be set to a production environment           |
| `SESSION_SECRET`         | Secret for `express-session`. Defaults to `'sandcrawler-138577'`. This should always be set in a production environment.                                                                                              |
| `SUBMISSIONS_TOP_UP`     | Use this to inflate the number of submissions displayed on the landing page. Defaults to `0`.                                                                                                                         |

#### Banners

| Variable                 | Description                                                                                                                                                                                                           |
| :----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_BANNER_CONTENT`    | If set, displays a banner message on both private routes that `ADMIN_BANNER_CONTENT` covers **and** public form routes that `IS_GENERAL_MAINTENANCE` covers. Overrides all other banner environment variables         |
| `ADMIN_BANNER_CONTENT`   | If set, displays a banner message on private admin routes such as the form list page as well as form builder pages.                                                                                                   |
| `IS_LOGIN_BANNER`   | If set, displays a banner message on the login page                              |
| `IS_GENERAL_MAINTENANCE` | If set, displays a banner message on all forms. Overrides `IS_SP_MAINTENANCE` and `IS_CP_MAINTENANCE`.                                                                                                                |

#### AWS services

| Variable                      | Description                                                                                                                         |
| :---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `AWS_REGION`                  | AWS region.                                                                                                                         |
| `AWS_ACCESS_KEY_ID`           | AWS IAM access key ID used to access S3.                                                                                            |
| `AWS_SECRET_ACCESS_KEY`       | AWS IAM access secret used to access S3.                                                                                            |
| `AWS_ENDPOINT`                 | AWS S3 bucket endpoint. region.                                                                                                                         |
| `IMAGE_S3_BUCKET`             | Name of S3 bucket for image field uploads.                                                                                          |
| `LOGO_S3_BUCKET`              | Name of S3 bucket for form logo uploads.                                                                                            |
| `LOGO_S3_BUCKET`              | Name of S3 bucket for form logo uploads.                                                                                            |
| `CUSTOM_CLOUDWATCH_LOG_GROUP` | Name of CloudWatch log group to send custom logs. Use this if you want some logs to have custom settings, e.g. shorter expiry time. |

#### [FormSG JavaScript SDK](https://www.npmjs.com/package/@opengovsg/formsg-sdk)

| Variable          | Description                           |
| :---------------- | ------------------------------------- |
| `FORMSG_SDK_MODE` | The mode to instantiate the sdk with. |

#### Email and Nodemailer

| Variable              | Description                                                                                                                                                                                    |
| :-------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SES_HOST`            | SMTP hostname.                                                                                                                                                                                 |
| `SES_PORT`            | SMTP port number.                                                                                                                                                                              |
| `SES_USER`            | SMTP username.                                                                                                                                                                                 |
| `SES_PASS`            | SMTP password.                                                                                                                                                                                 |
| `SES_MAX_MESSAGES`    | Nodemailer configuration. Connection removed and new one created when this limit is reached. This helps to keep the connection up-to-date for long-running email messaging. Defaults to `100`. |
| `SES_POOL`            | Connection pool to send email in parallel to the SMTP server. Defaults to `38`.                                                                                                                |
| `MAIL_FROM`           | Sender email address. Defaults to `'donotreply@mail.form.gov.sg'`.                                                                                                                             |  |
| `MAIL_SOCKET_TIMEOUT` | Milliseconds of inactivity to allow before killing a connection. This helps to keep the connection up-to-date for long-running email messaging. Defaults to `600000`.                          |
| `MAIL_LOGGER`         | If set to true then logs to console. If value is not set or is false then nothing is logged.                                                                                                   |
| `MAIL_DEBUG`          | If set to `true`, then logs SMTP traffic, otherwise logs only transaction events.                                                                                                              |
| `CHROMIUM_BIN`        | Filepath to chromium binary. Required for email autoreply PDF generation with Puppeteer.                                                                                                       |
| `BOUNCE_LIFE_SPAN`       | Time in milliseconds that bounces are tracked for each form. Defaults to 1800000ms or 30 minutes. Only relevant if you have set up AWS to send bounce and delivery notifications to the /emailnotifications endpoint. |

### Additional Features

The app supports a number of additional features like Captcha protection, Sentry reporting and Google Analytics. Each of these features requires specific environment variables which are detailed below. To deploy a bare bones application without these additional features, one can safely exclude the respective environment variables without any extra configuration.

#### Google Captcha

If this feature is enabled, forms with be protected with [recaptcha](https://www.google.com/recaptcha/about/), preventing submissions from being made by bots.

| Variable                | Description                |
| :---------------------- | -------------------------- |
| `GOOGLE_CAPTCHA`        | Google Captcha private key |
| `GOOGLE_CAPTCHA_PUBLIC` | Google Captcha public key. |

#### Google Analytics

If this feature is enabled, [google analytics](https://analytics.google.com/analytics/web) will be used to track website traffic. Examples of events include number of visits to various forms, number of successful submissions and number of submission failures.

| Variable         | Description                   |
| :--------------- | ----------------------------- |
| `GA_TRACKING_ID` | Google Analytics tracking ID. |

#### Sentry.io

If this feature is enabled, client-side error events will be piped to [sentry.io](https://sentry.io/welcome/) for monitoring purposes.

| Variable            | Description                                                                                           |
| :------------------ | ----------------------------------------------------------------------------------------------------- |
| `CSP_REPORT_URI`    | Reporting URL for Content Security Policy violdations. Can be configured to use a Sentry.io endpoint. |
| `SENTRY_CONFIG_URL` | Sentry.io URL for configuring the Raven SDK.                                                          |
| `CSP_REPORT_URI`    | Reporting URL for Content Security Policy violdations. Can be configured to use a Sentry.io endpoint. |

#### Examples page Using Pre-Computed Results

If this feature is enabled, the submission statistics associated with forms loaded on the examples page will be fetched from the pre-computed values in the FormStatisticsTotal collection. The FormStatisticsTotal collection only exists if the [batch jobs](https://github.com/datagovsg/formsg-batch-jobs/) needed to calculate the submission statistics are run daily.

If this feature is not enabled, the submission statistics associated with forms loaded on the examples page will be calculated on the fly from the Submissions collection. This may be sub-optimal when submissions are in the millions.

| Variable               | Description                                                           |
| :--------------------- | --------------------------------------------------------------------- |
| `AGGREGATE_COLLECTION` | Has to be defined (i.e. =true) if FormStats collection is to be used. |

#### SMS with Twilio

If this feature is enabled, the Mobile Number field will support form-fillers verifying their mobile numbers via a One-Time-Pin sent to their mobile phones and will also support an SMS confirmation of successful submission being sent out to their said mobile numbers. All messages are sent using [twilio](https://www.twilio.com/) messaging APIs.

Note that verifiying mobile numbers also requires [Verified Emails/SMSes](#verified-emailssmses) to be enabled.

| Variable                       | Description              |
| :----------------------------- | ------------------------ |
| `TWILIO_ACCOUNT_SID`           | Twilio messaging ID.     |
| `TWILIO_API_KEY`               | Twilio standard API Key. |
| `TWILIO_API_SECRET`            | Twilio API Secret.       |
| `TWILIO_MESSAGING_SERVICE_SID` | Messaging service ID.    |

#### SingPass/CorpPass and MyInfo

If this feature is enabled, forms will support authentication via [SingPass](https://www.singpass.gov.sg/singpass/common/aboutus) (Singapore's Digital Identity for Citizens) and
[CorpPass](https://www.corppass.gov.sg/corppass/common/aboutus) (Singapore's Digital Identity for Organizations). Forms will also support pre-filling using [MyInfo](https://www.singpass.gov.sg/myinfo/intro) after a citizen has successfully authenticated using SingPass.

Note that MyInfo is currently not supported for storage mode forms and enabling SingPass/CorpPass on storage mode forms also requires [SingPass/CorpPass for Storage Mode](#webhooks-and-singpasscorppass-for-storage-mode) to be enabled.

| Variable                        | Description                                                                                                                                                            |
| :------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SPCP_COOKIE_MAX_AGE_PRESERVED` | Duration of SingPass JWT before expiry in milliseconds. Defaults to 30 days.                                                                                           |
| `SINGPASS_ESRVC_ID`             | e-service ID registered with National Digital Identity office for SingPass authentication.                                                                             |
| `SINGPASS_PARTNER_ENTITY_ID`    | Partner ID registered with National Digital Identity Office for SingPass authentication.                                                                               |
| `SINGPASS_IDP_LOGIN_URL`        | URL of SingPass Login Page.                                                                                                                                            |
| `SINGPASS_IDP_ENDPOINT`         | URL to retrieve NRIC of SingPass-validated user from.                                                                                                                  |
| `SINGPASS_IDP_ID`               | Partner ID of National Digital Identity Office for SingPass authentication.                                                                                            |
| `CORPPASS_ESRVC_ID`             | e-service ID registered with National Digital Identity office for CorpPass authentication.                                                                             |
| `CORPPASS_PARTNER_ENTITY_ID`    | Partner ID registered with National Digital Identity Office for CorpPass authentication.                                                                               |
| `CORPPASS_IDP_LOGIN_URL`        | URL of CorpPass Login Page.                                                                                                                                            |
| `CORPPASS_IDP_ENDPOINT`         | URL to retrieve UEN of CorpPass-validated user from.                                                                                                                   |
| `CORPPASS_IDP_ID`               | Partner ID of National Digital Identity Office for CorpPass authentication.                                                                                            |
| `SP_FORMSG_KEY_PATH`            | Path to X.509 key used for SingPass related communication with National Digital Identity office.                                                                       |
| `SP_FORMSG_CERT_PATH`           | Path to X.509 cert used for SingPass related communication with National Digital Identity office.                                                                      |
| `SP_IDP_CERT_PATH`              | Path to National Digital Identity office's X.509 cert used for SingPass related communication.                                                                         |
| `CP_FORMSG_KEY_PATH`            | Path to X.509 key used for CorpPass related communication with National Digital Identity office.                                                                       |
| `CP_FORMSG_CERT_PATH`           | Path to X.509 cert used for CorpPass related communication with National Digital Identity office.                                                                      |
| `CP_IDP_CERT_PATH`              | Path to National Digital Identity office's X.509 cert used for CorpPass related communication.                                                                         |
| `MYINFO_CLIENT_CONFIG`          | Configures [MyInfoGovClient](https://github.com/opengovsg/myinfo-gov-client). Set this to either`stg` or `prod` to fetch MyInfo data from the corresponding endpoints. |
| `MYINFO_FORMSG_KEY_PATH`        | Filepath to MyInfo private key, which is used to decrypt returned responses.                                                                                           |
| `MYINFO_APP_KEY`                | (deprecated) Directly specify contents of the MyInfo FormSG private key. Only works if `NODE_ENV` is set to `development`.                                             |
| `IS_SP_MAINTENANCE`      | If set, displays a banner message on SingPass forms. Overrides `IS_CP_MAINTENANCE`.                                                                                                                                   |
| `IS_CP_MAINTENANCE`      | If set, displays a banner message on CorpPass forms.                                                                                                                                                                  |

#### Verified Emails/SMSes

If this feature is enabled, the Mobile Number field will support form-fillers verifying their mobile numbers via a One-Time-Pin sent to their mobile phones and the Email field will support form-fillers verifying their email addresses via a One-Time-Pin sent to their email boxes.

Note that verified SMSes also requires [SMS with Twilio](#sms-with-twilio) to be enabled.

| Variable                  | Description                                                    |
| :------------------------ | -------------------------------------------------------------- |
| `VERIFICATION_SECRET_KEY` | The secret key for signing verified responses (email, mobile). |

#### Webhooks and SingPass/CorpPass for Storage Mode

If this feature is enabled, storage mode forms will support posting encrypted form submissions to a REST API supplied by the form creator. The [FormSG SDK](https://github.com/opengovsg/formsg-javascript-sdk) can then be used to verify the signed posted data and decrypt the encrypted submission contained within.

If this feature is enabled, storage mode forms will also support authentication via SingPass or CorpPass. Note that this also requires [SingPass/CorpPass and MyInfo](#singpasscorppass-and-myinfo) to be enabled.

| Variable             | Description                                                           |
| :------------------- | --------------------------------------------------------------------- |
| `SIGNING_SECRET_KEY` | The secret key for signing verified content passed into the database. |

### Tests

| Variable               | Description                                                                                                                                     |
| :--------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGO_BINARY_VERSION` | Version of the Mongo binary used. Defaults to `'latest'` according to [MongoMemoryServer](https://github.com/nodkz/mongodb-memory-server) docs. |
| `PWD`                  | Path of working directory.                                                                                                                      |
| `MOCK_WEBHOOK_CONFIG_FILE`                  | Path of configuration file for mock webhook server                                                                                                                      |
| `MOCK_WEBHOOK_PORT`                  | Port of mock webhook server                                                                                                                      |
| `FORMSG_LOCALSTACK_ENDPT`                  | Endpoint for local development equivalent of S3                                                                                                                     |
