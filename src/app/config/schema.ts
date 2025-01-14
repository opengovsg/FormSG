import { PackageMode } from '@opengovsg/formsg-sdk/dist/types'
import awsInfo from 'aws-info'
import convict, { Schema } from 'convict'
import { email, url } from 'convict-format-with-validator'
import { isNil } from 'lodash'
import mongodbUri from 'mongodb-uri'
import validator from 'validator'

import {
  Environment,
  IBucketUrlSchema,
  ICompulsoryVarsSchema,
  IOptionalVarsSchema,
  IProdOnlyVarsSchema,
} from '../../types'

convict.addFormat(url)
convict.addFormat(email)
convict.addFormat({
  name: 'string[]',
  validate: (val: string[]) => {
    if (!Array.isArray(val)) {
      throw new Error('must be of type Array')
    }
    if (val.some((i) => typeof i !== 'string')) {
      throw new Error('Elements must be of type string')
    }
  },
  coerce: (val: string): string[] => {
    return val.split(',')
  },
})

/**
 * Verifies that S3 bucket url is a valid url with or without trailing slash
 */
const validateS3BucketUrl = (
  val: string,
  {
    isDev,
    hasTrailingSlash,
    region,
  }: { isDev: boolean; hasTrailingSlash: boolean; region: string },
) => {
  /* eslint-disable typesafe/no-throw-sync-func
    --------
    The convict package expects format validation functions to throw Errors */
  if (!validator.isURL(val, { require_tld: !isDev })) {
    throw new Error('must be a url')
  }
  if (hasTrailingSlash) {
    if (!/[/]$/.test(val)) {
      throw new Error('must end with a slash')
    }
  } else {
    if (/[/]$/.test(val)) {
      throw new Error('must not end with a slash')
    }
  }
  // Region should be specified correctly in production
  const isS3RegionCorrect = new RegExp(
    `^https://s3.${region}.amazonaws.com`,
    'i',
  )
  const isR2 = new RegExp(`^https://\\w+.r2.cloudflarestorage.com`, 'i')
  if (!isDev && !isS3RegionCorrect.test(val) && !isR2.test(val)) {
    throw new Error(
      `region should be ${region}, or url should be for Cloudflare R2`,
    )
  }
  /* eslint-enable typesafe/no-throw-sync-func */
}

// If the default value does not match the format specified, the configuration built from this schema
// will throw an error upon validation (i.e. All env vars with default null have to be specified)
export const compulsoryVarsSchema: Schema<ICompulsoryVarsSchema> = {
  awsConfig: {
    imageS3Bucket: {
      doc: 'S3 Bucket to upload images to',
      format: String,
      default: null,
      env: 'IMAGE_S3_BUCKET',
    },
    logoS3Bucket: {
      doc: 'S3 Bucket to upload logos to',
      format: String,
      default: null,
      env: 'LOGO_S3_BUCKET',
    },
    attachmentS3Bucket: {
      doc: 'S3 Bucket to upload encrypted attachments to',
      format: String,
      default: null,
      env: 'ATTACHMENT_S3_BUCKET',
    },
    paymentProofS3Bucket: {
      doc: 'S3 Bucket to upload payment proof to',
      format: String,
      default: null,
      env: 'PAYMENT_PROOF_S3_BUCKET',
    },
    staticAssetsS3Bucket: {
      doc: 'S3 Bucket containing static assets',
      format: String,
      default: null,
      env: 'STATIC_ASSETS_S3_BUCKET',
    },
    virusScannerQuarantineS3Bucket: {
      doc: 'S3 Bucket to quarantine files for virus scanning',
      format: String,
      default: null,
      env: 'VIRUS_SCANNER_QUARANTINE_S3_BUCKET',
    },
    virusScannerCleanS3Bucket: {
      doc: 'S3 Bucket to store files that have been scanned and are clean',
      format: String,
      default: null,
      env: 'VIRUS_SCANNER_CLEAN_S3_BUCKET',
    },
  },
  core: {
    sessionSecret: {
      doc: 'Session Secret',
      format: String,
      default: null,
      env: 'SESSION_SECRET',
      sensitive: true,
    },
    secretEnv: {
      doc: 'Secret Environment used to build key for AWS Secrets Manager',
      format: String,
      default: null,
      env: 'SECRET_ENV',
    },
    envSiteName: {
      doc: 'Environment site name used to build key for AWS Secrets Manager',
      format: String,
      default: null,
      env: 'SSM_ENV_SITE_NAME',
    },
  },
}

// If the following environment variables are not specified, we will fall back to the defaults provided
export const optionalVarsSchema: Schema<IOptionalVarsSchema> = {
  appConfig: {
    title: {
      doc: 'Application name in window title',
      format: String,
      default: 'FormSG',
      env: 'APP_NAME',
    },
    description: {
      doc: 'Application description in meta tag',
      format: String,
      default: 'Trusted form manager of the Singapore Government',
      env: 'APP_DESC',
    },
    appUrl: {
      doc: 'Application url in meta tag',
      format: 'url',
      default: 'https://form.gov.sg',
      env: 'APP_URL',
    },
    feAppUrl: {
      doc: 'For local dev use only - frontend app url',
      format: 'url',
      default: 'https://form.gov.sg',
      env: 'FE_APP_URL',
    },
    keywords: {
      doc: 'Application keywords in meta tag',
      format: String,
      default: 'forms, formbuilder, nodejs',
      env: 'APP_KEYWORDS',
    },
    twitterImage: {
      doc: 'Application image in twitter meta tag',
      format: String,
      default: '/public/modules/core/img/og/logo-vertical-color.png',
      env: 'APP_TWITTER_IMAGE',
    },
    images: {
      doc: 'Application images in meta tag',
      format: 'string[]',
      default: [
        '/public/modules/core/img/og/img_metatag.png',
        '/public/modules/core/img/og/logo-vertical-color.png',
      ],
      env: 'APP_IMAGES',
    },
  },
  banner: {
    isGeneralMaintenance: {
      doc: 'Load env variable with General Maintenance banner text.',
      format: String,
      default: '',
      env: 'IS_GENERAL_MAINTENANCE',
    },
    isLoginBanner: {
      doc: 'The banner message on login page. Allows for HTML.',
      format: String,
      default: '',
      env: 'IS_LOGIN_BANNER',
    },
    siteBannerContent: {
      doc: 'The banner message to show on all pages. Allows for HTML. Will supersede all other banner content if it exists.',
      format: String,
      default: '',
      env: 'SITE_BANNER_CONTENT',
    },
    adminBannerContent: {
      doc: 'The banner message to show on on admin pages. Allows for HTML.',
      format: String,
      default: '',
      env: 'ADMIN_BANNER_CONTENT',
    },
  },
  formsgSdkMode: {
    doc: 'Inform SDK which public keys are to be used to sign, encrypt, or decrypt data that is passed to it',
    format: ['staging', 'production', 'development', 'test'],
    default: 'production' as PackageMode,
    env: 'FORMSG_SDK_MODE',
  },
  mail: {
    from: {
      doc: 'Sender email address',
      format: 'email',
      default: 'donotreply@mail.form.gov.sg',
      env: 'MAIL_FROM',
    },
    official: {
      doc: 'Official email address to reply to',
      format: 'email',
      default: 'form@open.gov.sg',
      env: 'MAIL_OFFICIAL',
    },
    logger: {
      doc: 'If set to true then logs to console',
      format: 'Boolean',
      default: false,
      env: 'MAIL_LOGGER',
    },
    debug: {
      doc: 'If set to true, then logs SMTP traffic, otherwise logs only transaction events.',
      format: 'Boolean',
      default: false,
      env: 'MAIL_DEBUG',
    },
    bounceLifeSpan: {
      doc: 'TTL of bounce documents in milliseconds',
      format: 'int',
      default: 86400000,
      env: 'BOUNCE_LIFE_SPAN',
    },
    chromiumBin: {
      doc: 'Path to chromium executable for PDF generation',
      format: String,
      default: '/usr/bin/chromium-browser',
      env: 'CHROMIUM_BIN',
    },
    maxMessages: {
      doc: 'Nodemailer config to help to keep the connection up-to-date for long-running messaging',
      format: 'int',
      default: 100,
      env: 'SES_MAX_MESSAGES',
    },
    maxConnections: {
      doc: 'Connection pool to send email in parallel to the SMTP server',
      format: 'int',
      default: 38,
      env: 'SES_POOL',
    },
    socketTimeout: {
      doc: 'Milliseconds of inactivity to allow before killing a connection',
      format: 'int',
      default: 600000,
      env: 'MAIL_SOCKET_TIMEOUT',
    },
  },
  awsConfig: {
    region: {
      doc: 'Region that S3 bucket is located in',
      format: Object.keys(awsInfo.data.regions),
      default: 'ap-southeast-1',
      env: 'AWS_REGION',
    },
    customCloudWatchGroup: {
      doc: 'Name of CloudWatch log group to store short-term logs. Log streams are separated by date.',
      format: String,
      default: '',
      env: 'CUSTOM_CLOUDWATCH_LOG_GROUP',
    },
    virusScannerLambdaFunctionName: {
      doc: 'Virus scanner lambda function name',
      format: String,
      default: '',
      env: 'VIRUS_SCANNER_LAMBDA_FUNCTION_NAME',
    },
    virusScannerLambdaEndpoint: {
      doc: 'Endpoint address for virus scanner lambda function. Specify this if the lambda is hosted neither on AWS nor your local dev environment.',
      format: String,
      default: '',
      env: 'VIRUS_SCANNER_LAMBDA_ENDPOINT',
    },
  },
  core: {
    port: {
      doc: 'Application Port',
      format: 'port',
      default: 5000,
      env: 'PORT',
    },
    otpLifeSpan: {
      doc: 'OTP Life Span for Login. (Should be in miliseconds, e.g. 1000 * 60 * 15 = 15 mins)',
      format: 'int',
      default: 900000,
      env: 'OTP_LIFE_SPAN',
    },
    submissionsTopUp: {
      doc: 'Number of submissions to top up submissions statistic by',
      format: 'int',
      default: 0,
      env: 'SUBMISSIONS_TOP_UP',
    },
    nodeEnv: {
      doc: 'Express environment mode',
      format: [Environment.Prod, Environment.Dev, Environment.Test],
      default: Environment.Prod,
      env: 'NODE_ENV',
    },
    useMockPostmanSms: {
      doc: 'Enables Postman SMS API mocking and directs SMS body over to maildev',
      format: 'Boolean',
      default: false,
      env: 'USE_MOCK_POSTMAN_SMS',
    },
  },
  rateLimit: {
    submissions: {
      doc: 'Per-minute, per-IP, per-instance request limit for submissions endpoints',
      format: 'int',
      default: 80,
      env: 'SUBMISSIONS_RATE_LIMIT',
    },
    sendAuthOtp: {
      doc: 'Per-minute, per-IP request limit for OTPs to log in to the admin console or mobile / email field verifications',
      format: 'int',
      default: 60,
      env: 'SEND_AUTH_OTP_RATE_LIMIT',
    },
    publicFormIssueFeedback: {
      doc: 'Per-minute, per-IP, per form request limit for public form issue feedback endpoints',
      format: 'int',
      default: 3,
      env: 'PUBLIC_FORM_ISSUE_FEEDBACK_RATE_LIMIT',
    },
    downloadPaymentReceipt: {
      doc: 'Per-minute, per-IP request limit to download the payment receipt from Stripe',
      format: 'int',
      default: 10,
      env: 'DOWNLOAD_PAYMENT_RECEIPT_RATE_LIMIT',
    },
    downloadFormWhitelist: {
      doc: 'Per-minute, per-IP request limit to download the form whitelist',
      format: 'int',
      default: 10,
      env: 'DOWNLOAD_FORM_WHITELIST_RATE_LIMIT',
    },
    uploadFormWhitelist: {
      doc: 'Per-minute, per-IP request limit to upload the form whitelist',
      format: 'int',
      default: 10,
      env: 'UPLOAD_FORM_WHITELIST_RATE_LIMIT',
    },
    publicApi: {
      doc: 'Per-minute, per-IP, per-instance request limit for public APIs',
      format: 'int',
      default: 100,
      env: 'PUBLIC_API_RATE_LIMIT',
    },
    platformApi: {
      doc: 'Per-minute, per-IP, per-instance request limit for platform APIs',
      format: 'int',
      default: 100,
      env: 'PLATFORM_API_RATE_LIMIT',
    },
    makeTextPrompt: {
      doc: 'Per-minute, per-IP request limit for making text prompts',
      format: 'int',
      default: 5,
      env: 'MAKE_TEXT_PROMPT_RATE_LIMIT',
    },
  },
  reactMigration: {
    useFetchForSubmissions: {
      // TODO (#5826): Toggle to use fetch for submissions instead of axios. Remove once network error is resolved
      doc: 'Toggle to use fetch for submissions instead of axios',
      format: Boolean,
      default: false,
      env: 'REACT_MIGRATION_USE_FETCH_FOR_SUBMISSIONS',
    },
  },
  publicApi: {
    apiKeyVersion: {
      doc: 'API key version',
      format: String,
      default: 'v1',
      env: 'API_KEY_VERSION',
    },
  },
  adminFeedback: {
    adminFeedbackFieldThreshold: {
      doc: 'Threshold of number of form fields in active form for admin to be eligible for admin feedback, default is 5',
      format: Number,
      default: 5,
      env: 'ADMIN_FEEDBACK_FIELD_THRESHOLD',
    },
    adminFeedbackDisplayFrequency: {
      doc: 'Frequency to display admin feedback, measured in miliseconds, default is 28days (1000(ms)*60(s)*60(min)*24(hrs)*28(days))',
      format: Number,
      default: 2419200000,
      env: 'ADMIN_FEEDBACK_DISPLAY_FREQUENCY',
    },
  },
}

export const prodOnlyVarsSchema: Schema<IProdOnlyVarsSchema> = {
  port: {
    doc: 'SMTP port number',
    format: 'port',
    default: null,
    env: 'SES_PORT',
  },
  host: {
    doc: 'SMTP hostname',
    format: String,
    default: null,
    env: 'SES_HOST',
  },
  user: {
    doc: 'SMTP username',
    format: String,
    default: null,
    env: 'SES_USER',
  },
  pass: {
    doc: 'SMTP password',
    format: String,
    default: null,
    env: 'SES_PASS',
    sensitive: true,
  },
  sesConfigSet: {
    doc: 'Config set for SES when sending email',
    format: String,
    default: null,
    env: 'SES_CONFIG_SET',
    sensitive: true,
  },
  dbHost: {
    doc: 'Database URI',
    format: (val) => {
      // Will throw error if scheme and hosts are not present
      const uriObject = mongodbUri.parse(val)
      /*
        e.g. mongodb://database:27017/formsg will be parsed into:
        {
          scheme: 'mongodb',
          database: 'formsg',
          hosts: [ { host: 'database', port: 27017 } ]
        }
        e.g. https://form.gov.sg will be parsed into:
        {
          scheme: 'https',
          hosts: [ { host: 'form.gov.sg' } ]
        }
      */
      if (uriObject.scheme !== 'mongodb') {
        throw new Error('Scheme must be mongodb')
      }
      if (isNil(uriObject.database)) {
        throw new Error('Database must be specified')
      }
    },
    default: null,
    env: 'DB_HOST',
    sensitive: true,
  },
}

export const loadS3BucketUrlSchema = ({
  isDev,
  region,
}: {
  isDev: boolean
  region: string
}): Schema<IBucketUrlSchema> => {
  return {
    endPoint: {
      doc: 'Endpoint for S3 buckets',
      format: (val) =>
        validateS3BucketUrl(val, { isDev, hasTrailingSlash: false, region }),
      default: `https://s3.${region}.amazonaws.com`, // NOTE NO TRAILING / AT THE END OF THIS URL!
      env: 'AWS_ENDPOINT',
    },
    attachmentBucketUrl: {
      doc: 'Url of attachment S3 bucket derived from S3 endpoint and bucket name',
      format: (val) =>
        validateS3BucketUrl(val, { isDev, hasTrailingSlash: true, region }),
      default: null,
    },
    logoBucketUrl: {
      doc: 'Url of logo S3 bucket derived from S3 endpoint and bucket name',
      format: (val) =>
        validateS3BucketUrl(val, { isDev, hasTrailingSlash: false, region }),
      default: null,
    },
    imageBucketUrl: {
      doc: 'Url of images S3 bucket derived from S3 endpoint and bucket name',
      format: (val) =>
        validateS3BucketUrl(val, { isDev, hasTrailingSlash: false, region }),
      default: null,
    },
    staticAssetsBucketUrl: {
      doc: 'Url of static assets S3 bucket.',
      format: (val) =>
        validateS3BucketUrl(val, { isDev, hasTrailingSlash: false, region }),
      default: null,
    },
    virusScannerQuarantineS3BucketUrl: {
      doc: 'Url of virus scanner quarantine S3 bucket.',
      format: (val) =>
        validateS3BucketUrl(val, { isDev, hasTrailingSlash: false, region }),
      default: null,
    },
    paymentProofS3BucketUrl: {
      doc: 'Url of payment proof S3 bucket.',
      format: (val) =>
        validateS3BucketUrl(val, { isDev, hasTrailingSlash: false, region }),
      default: null,
    },
  }
}
