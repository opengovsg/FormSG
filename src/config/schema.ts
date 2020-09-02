import { PackageMode } from '@opengovsg/formsg-sdk/dist/types'
import awsInfo from 'aws-info'
import convict, { Schema } from 'convict'
import { email, url } from 'convict-format-with-validator'
import { isNil } from 'lodash'
import mongodbUri from 'mongodb-uri'
import validator from 'validator'

import { AWS_DEFAULT } from '../shared/constants'
import {
  Environment,
  IBucketUrlSchema,
  ICompulsoryVarsSchema,
  IOptionalVarsSchema,
  IProdOnlyVarsSchema,
} from '../types'

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
export const validateBucketUrl = (
  val: string,
  { isDev, hasTrailingSlash }: { isDev: boolean; hasTrailingSlash: boolean },
) => {
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
}

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
  },
  core: {
    sessionSecret: {
      doc: 'Session Secret',
      format: String,
      default: null,
      env: 'SESSION_SECRET',
      sensitive: true,
    },
  },
}

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
      default: 'Form Manager for Government',
      env: 'APP_DESC',
    },
    appUrl: {
      doc: 'Application url in meta tag',
      format: 'url',
      default: 'https://form.gov.sg',
      env: 'APP_URL',
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
      doc:
        'The banner message to show on all pages. Allows for HTML. Will supersede all other banner content if it exists.',
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
    doc:
      'Inform SDK which public keys are to be used to sign, encrypt, or decrypt data that is passed to it',
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
    logger: {
      doc: 'If set to true then logs to console',
      format: 'Boolean',
      default: false,
      env: 'MAIL_LOGGER',
    },
    debug: {
      doc:
        'If set to true, then logs SMTP traffic, otherwise logs only transaction events.',
      format: 'Boolean',
      default: false,
      env: 'MAIL_DEBUG',
    },
    bounceLifeSpan: {
      doc: 'TTL of bounce documents in milliseconds',
      format: 'int',
      default: 10800000,
      env: 'BOUNCE_LIFE_SPAN',
    },
    chromiumBin: {
      doc: 'Path to chromium executable for PDF generation',
      format: String,
      default: '/usr/bin/chromium-browser',
      env: 'CHROMIUM_BIN',
    },
    maxMessages: {
      doc:
        'Nodemailer config to help to keep the connection up-to-date for long-running messaging',
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
      default: AWS_DEFAULT.region,
      env: 'AWS_REGION',
    },
    customCloudWatchGroup: {
      doc:
        'Name of CloudWatch log group to store short-term logs. Log streams are separated by date.',
      format: String,
      default: '',
      env: 'CUSTOM_CLOUDWATCH_LOG_GROUP',
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
      doc:
        'OTP Life Span for Login. (Should be in miliseconds, e.g. 1000 * 60 * 15 = 15 mins)',
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

export const loadS3BucketUrlSchema = (
  isDev: boolean,
): Schema<IBucketUrlSchema> => {
  return {
    attachmentBucketUrl: {
      doc:
        'Url of attachment S3 bucket derived from S3 endpoint and bucket name',
      format: (val) =>
        validateBucketUrl(val, { isDev, hasTrailingSlash: true }),
      default: null,
    },
    logoBucketUrl: {
      doc: 'Url of logo S3 bucket derived from S3 endpoint and bucket name',
      format: (val) =>
        validateBucketUrl(val, { isDev, hasTrailingSlash: false }),
      default: null,
    },
    imageBucketUrl: {
      doc: 'Url of images S3 bucket derived from S3 endpoint and bucket name',
      format: (val) =>
        validateBucketUrl(val, { isDev, hasTrailingSlash: false }),
      default: null,
    },
  }
}
