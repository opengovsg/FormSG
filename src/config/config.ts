import { PackageMode } from '@opengovsg/formsg-sdk/dist/types'
import awsInfo from 'aws-info'
import aws from 'aws-sdk'
import convict from 'convict'
import crypto from 'crypto'
import { SessionOptions } from 'express-session'
import nodemailer from 'nodemailer'
import directTransport from 'nodemailer-direct-transport'
import Mail from 'nodemailer/lib/mailer'
import SMTPPool from 'nodemailer/lib/smtp-pool'
import { promisify } from 'util'
import validator from 'validator'

import { Config, DbConfig, Environment, MailConfig } from '../types'

import defaults from './defaults'
import { createLoggerWithLabel } from './logger'

convict.addFormat(require('convict-format-with-validator').url)

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

const configuration = convict({
  sessionSecret: {
    doc: 'Session Secret',
    format: String,
    default: defaults.app.sessionSecret,
    env: 'SESSION_SECRET',
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
  bounceLifeSpan: {
    doc: 'TTL of bounce documents in milliseconds',
    format: 'int',
    default: defaults.bounce.bounceLifeSpan,
    env: 'BOUNCE_LIFE_SPAN',
  },
  submissionsTopUp: {
    doc: 'Number of submissions to top up submissions statistic by',
    format: 'int',
    default: 0,
    env: 'SUBMISSIONS_TOP_UP',
  },
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
  formsgSdkMode: {
    doc:
      'Inform SDK which public keys are to be used to sign, encrypt, or decrypt data that is passed to it',
    format: ['staging', 'production', 'development', 'test'],
    default: 'production' as PackageMode,
    env: 'FORMSG_SDK_MODE',
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
    attachmentBucketUrl: {
      format: (val) => {
        if (!validator.isURL(val)) {
          throw new Error('must be a url')
        }
        if (!/[/]$/.test(val)) {
          throw new Error('must end with a slash')
        }
      },
      default: null,
    },
    logoBucketUrl: {
      format: (val) => {
        if (!validator.isURL(val)) {
          throw new Error('must be a url')
        }
        if (/[/]$/.test(val)) {
          throw new Error('must not end with a slash')
        }
      },
      default: null,
    },
    imageBucketUrl: {
      format: (val) => {
        if (!validator.isURL(val)) {
          throw new Error('must be a url')
        }
        if (/[/]$/.test(val)) {
          throw new Error('must not end with a slash')
        }
      },
      default: null,
    },
  },
  cspReportUri: {
    doc: 'Endpoint for content security policy reporting',
    format: String,
    default: 'undefined', // HelmetJS reportUri param requires non-empty string
    env: 'CSP_REPORT_URI',
  },
  chromiumBin: {
    doc: 'Path to chromium executable for PDF generation',
    format: String,
    default: null, // HelmetJS reportUri param requires non-empty string
    env: 'CSP_REPORT_URI',
  },
})

// Environment variables with defaults
const isDev =
  process.env.NODE_ENV === Environment.Dev ||
  process.env.NODE_ENV === Environment.Test
const nodeEnv = isDev ? Environment.Dev : Environment.Prod

// Construct bucket URLs depending on node environment
// If in development env, endpoint communicates with localstack, a fully
// functional local AWS cloud stack for hosting images/logos/attachments.
// Else, the environment variables to instantiate S3 are used.
const awsEndpoint = isDev
  ? defaults.aws.endpoint
  : `https://s3.${configuration.get('awsConfig.region')}.amazonaws.com` // NOTE NO TRAILING / AT THE END OF THIS URL!

configuration.load({
  'awsConfig.logoBucketUrl': `${awsEndpoint}/${configuration.get(
    'awsConfig.logoS3Bucket',
  )}`,
  'awsConfig.imageBucketUrl': `${awsEndpoint}/${configuration.get(
    'awsConfig.imageS3Bucket',
  )}`,
  // NOTE THE TRAILING / AT THE END OF THIS URL! This is only for attachments!
  'awsConfig.attachmentBucketUrl': `${awsEndpoint}/${configuration.get(
    'awsConfig.attachmentS3Bucket',
  )}/`,
})

const s3 = new aws.S3({
  region: configuration.get('awsConfig.region'),
  // Unset and use default if not in development mode
  // Endpoint and path style overrides are needed only in development mode for
  // localstack to work.
  endpoint: isDev ? defaults.aws.endpoint : undefined,
  s3ForcePathStyle: isDev ? true : undefined,
})

// Perform validation after env vars loaded
configuration.validate({ allowed: 'strict' })

const logger = createLoggerWithLabel(module)

// Optional environment variables
/**
 * Name of CloudWatch log group to store short-term logs. Log streams are
 * separated by date.
 */
const customCloudWatchGroup = process.env.CUSTOM_CLOUDWATCH_LOG_GROUP

/**
 * Load env variable with General Maintenance banner text.
 */
const isGeneralMaintenance = process.env.IS_GENERAL_MAINTENANCE

/**
 * The banner message on login page. Allows for HTML.
 */
const isLoginBanner = process.env.IS_LOGIN_BANNER

/**
 * The banner message to show on all pages. Allows for HTML. Will supersede
 * all other banner content if it exists.
 */
const siteBannerContent = process.env.SITE_BANNER_CONTENT

/**
 * The banner message to show on on admin pages. Allows for HTML.
 */
const adminBannerContent = process.env.ADMIN_BANNER_CONTENT

const dbConfig: DbConfig = {
  uri: process.env.DB_HOST || undefined,
  options: {
    user: '',
    pass: '',
    // Only create indexes in dev env to avoid adverse production impact.
    autoIndex: isDev,
    // Avoid using deprecated URL string parser in MongoDB driver
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Avoid using deprecated collection.ensureIndex internally
    useCreateIndex: true,
    // upgrade to mongo driver's native findOneAndUpdate function instead of
    // findAndModify.
    useFindAndModify: false,
    promiseLibrary: global.Promise,
  },
}

const mailConfig: MailConfig = (function () {
  const mailFrom = process.env.MAIL_FROM || defaults.mail.mailFrom
  const mailer = {
    from: `${configuration.get('appConfig.title')} <${mailFrom}>`,
  }

  // Creating mail transport
  const hasAllSesCredentials =
    process.env.SES_HOST &&
    process.env.SES_PORT &&
    process.env.SES_USER &&
    process.env.SES_PASS

  let transporter: Mail

  if (hasAllSesCredentials) {
    const options: SMTPPool.Options = {
      host: process.env.SES_HOST,
      auth: {
        user: process.env.SES_USER,
        pass: process.env.SES_PASS,
      },
      port: Number(process.env.SES_PORT),
      // Options as advised from https://nodemailer.com/usage/bulk-mail/
      // pool connections instead of creating fresh one for each email
      pool: true,
      maxMessages:
        Number(process.env.SES_MAX_MESSAGES) || defaults.ses.maxMessages,
      maxConnections:
        Number(process.env.SES_POOL) || defaults.ses.maxConnections,
      socketTimeout:
        Number(process.env.MAIL_SOCKET_TIMEOUT) || defaults.ses.socketTimeout,
      // If set to true then logs to console. If value is not set or is false
      // then nothing is logged.
      logger: String(process.env.MAIL_LOGGER).toLowerCase() === 'true',
      // If set to true, then logs SMTP traffic, otherwise logs only transaction
      // events.
      debug: String(process.env.MAIL_DEBUG).toLowerCase() === 'true',
    }

    transporter = nodemailer.createTransport(options)
  } else if (process.env.SES_PORT) {
    logger.warn({
      message:
        '\n!!! WARNING !!!\nNo SES credentials detected.\nUsing Nodemailer to send to local SMTP server instead.\nThis should NEVER be seen in production.',
      meta: {
        action: 'init.mailConfig',
      },
    })
    transporter = nodemailer.createTransport({
      port: Number(process.env.SES_PORT),
      ignoreTLS: true,
    })
  } else {
    logger.warn({
      message:
        '\n!!! WARNING !!!\nNo SES credentials detected.\nUsing Nodemailer Direct Transport instead.\nThis should NEVER be seen in production.',
      meta: {
        action: 'init.mailConfig',
      },
    })
    // Falls back to direct transport
    transporter = nodemailer.createTransport(directTransport({}))
  }

  return {
    mailFrom,
    mailer,
    transporter,
  }
})()

const cookieSettings: SessionOptions['cookie'] = {
  httpOnly: true, // JavaScript will not be able to read the cookie in case of XSS exploitation
  secure: !isDev, // true prevents cookie from being accessed over http
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  sameSite: 'strict', // Cookie will not be sent if navigating from another domain
}

// Functions
const configureAws = async () => {
  if (!isDev) {
    const getCredentials = () => {
      return new Promise((resolve, reject) => {
        aws.config.getCredentials((err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }
    await getCredentials()
    if (!aws.config.credentials.accessKeyId) {
      throw new Error(`AWS Access Key Id is missing`)
    }
    if (!aws.config.credentials.secretAccessKey) {
      throw new Error(`AWS Secret Access Key is missing`)
    }
  }
}

const config: Config = {
  app: configuration.get('appConfig'),
  db: dbConfig,
  aws: {
    ...configuration.get('awsConfig'),
    s3,
  },
  mail: mailConfig,
  cookieSettings,
  isDev,
  nodeEnv,
  port: configuration.get('port'),
  customCloudWatchGroup,
  sessionSecret: configuration.get('sessionSecret'),
  otpLifeSpan: configuration.get('otpLifeSpan'),
  bounceLifeSpan: configuration.get('bounceLifeSpan'),
  formsgSdkMode: configuration.get('formsgSdkMode'),
  chromiumBin: configuration.get('chromiumBin'),
  cspReportUri: configuration.get('cspReportUri'),
  submissionsTopUp: configuration.get('submissionsTopUp'),
  isGeneralMaintenance,
  isLoginBanner,
  siteBannerContent,
  adminBannerContent,
  configureAws,
}

export = config
