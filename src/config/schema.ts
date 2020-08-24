import { PackageMode } from '@opengovsg/formsg-sdk/dist/types'
import awsInfo from 'aws-info'
import convict, { Schema } from 'convict'
import { email, url } from 'convict-format-with-validator'
import { isNil } from 'lodash'
import mongodbUri from 'mongodb-uri'
import validator from 'validator'

import {
  Environment,
  IBasicSchema,
  IBucketUrlSchema,
  ISesSchema,
} from '../types'

import defaults from './defaults'

convict.addFormat(url)
convict.addFormat(email)
convict.addFormat({
  name: 'string[]',
  validate: (val: string[]) => {
    if (!Array.isArray(val)) {
      throw new Error('must be of type Array')
    }
    let isAllStrings = val.every((i) => typeof i === 'string')
    if (!isAllStrings) {
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
const validateBucketUrl = (
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

export const basicSchema: Schema<IBasicSchema> = {
  appConfig: {
    title: {
      format: String,
      default: defaults.app.name,
      env: 'APP_NAME',
    },
    description: {
      format: String,
      default: defaults.app.desc,
      env: 'APP_DESC',
    },
    appUrl: {
      format: 'url',
      default: defaults.app.url,
      env: 'APP_URL',
    },
    keywords: {
      format: String,
      default: defaults.app.keywords,
      env: 'APP_KEYWORDS',
    },
    twitterImage: {
      format: String,
      default: defaults.app.twitterImage,
      env: 'APP_TWITTER_IMAGE',
    },
    images: {
      format: 'string[]',
      default: defaults.app.images,
      env: 'APP_IMAGES',
    },
  },
  core: {
    sessionSecret: {
      doc: 'Session Secret',
      format: String,
      default: null,
      env: 'SESSION_SECRET',
    },
    dbHost: {
      doc: 'Database URI',
      format: String,
      default: '',
      env: 'DB_HOST',
    },
    port: {
      doc: 'Application Port',
      format: 'port',
      default: defaults.app.port,
      env: 'PORT',
    },
    otpLifeSpan: {
      doc:
        'OTP Life Span for Login. (Should be in miliseconds, e.g. 1000 * 60 * 15 = 15 mins)',
      format: 'int',
      default: defaults.login.otpLifeSpan,
      env: 'OTP_LIFE_SPAN',
    },
    submissionsTopUp: {
      doc: 'Number of submissions to top up submissions statistic by',
      format: 'int',
      default: 0,
      env: 'SUBMISSIONS_TOP_UP',
    },
    cspReportUri: {
      doc: 'Endpoint for content security policy reporting',
      format: String,
      default: 'undefined', // HelmetJS reportUri param requires non-empty string
      env: 'CSP_REPORT_URI',
    },
    nodeEnv: {
      doc: 'Express environment mode',
      format: [Environment.Prod, Environment.Dev, Environment.Test],
      default: Environment.Prod,
      env: 'NODE_ENV',
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
    region: {
      doc: 'Region that S3 bucket is located in',
      format: Object.keys(awsInfo.data.regions),
      default: defaults.aws.region,
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
      default: defaults.mail.mailFrom,
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
      default: defaults.bounce.bounceLifeSpan,
      env: 'BOUNCE_LIFE_SPAN',
    },
    chromiumBin: {
      doc: 'Path to chromium executable for PDF generation',
      format: String,
      default: defaults.mail.chromiumBin,
      env: 'CHROMIUM_BIN',
    },
    maxMessages: {
      doc:
        'Nodemailer config to help to keep the connection up-to-date for long-running messaging',
      format: 'int',
      default: defaults.ses.maxMessages,
      env: 'SES_MAX_MESSAGES',
    },
    maxConnections: {
      doc: 'Connection pool to send email in parallel to the SMTP server',
      format: 'int',
      default: defaults.ses.maxConnections,
      env: 'SES_POOL',
    },
    socketTimeout: {
      doc: 'Milliseconds of inactivity to allow before killing a connection',
      format: 'int',
      default: defaults.ses.socketTimeout,
      env: 'MAIL_SOCKET_TIMEOUT',
    },
  },
}

export const sesSchema: Schema<ISesSchema> = {
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
  },
}

export const loadS3BucketUrlSchema = (
  isDev: boolean,
): Schema<IBucketUrlSchema> => {
  return {
    attachmentBucketUrl: {
      format: (val) =>
        validateBucketUrl(val, { isDev, hasTrailingSlash: true }),
      default: null,
    },
    logoBucketUrl: {
      format: (val) =>
        validateBucketUrl(val, { isDev, hasTrailingSlash: false }),
      default: null,
    },
    imageBucketUrl: {
      format: (val) =>
        validateBucketUrl(val, { isDev, hasTrailingSlash: false }),
      default: null,
    },
  }
}
