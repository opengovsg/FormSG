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

// Environment variables with defaults
const isDev =
  process.env.NODE_ENV === Environment.Dev ||
  process.env.NODE_ENV === Environment.Test
const nodeEnv = isDev ? Environment.Dev : Environment.Prod

convict.addFormat(require('convict-format-with-validator').url)
convict.addFormat(require('convict-format-with-validator').email)

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

const validateBucketUrl = (val, { isDev, hasTrailingSlash }) => {
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
    default: null,
    env: 'CHROMIUM_BIN',
  },
  customCloudWatchGroup: {
    doc:
      'Name of CloudWatch log group to store short-term logs. Log streams are separated by date.',
    format: String,
    default: '',
    env: 'CUSTOM_CLOUDWATCH_LOG_GROUP',
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
  dbHost: {
    doc: 'Database URI',
    format: String,
    default: '',
    env: 'DB_HOST',
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
  },
  ses: {
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
})

const prodOnlyConfig = convict({
  ses: {
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
  },
})

// Construct bucket URLs depending on node environment
// If in development env, endpoint communicates with localstack, a fully
// functional local AWS cloud stack for hosting images/logos/attachments.
// Else, the environment variables to instantiate S3 are used.
const awsEndpoint = isDev
  ? defaults.aws.endpoint
  : `https://s3.${configuration.get('awsConfig.region')}.amazonaws.com` // NOTE NO TRAILING / AT THE END OF THIS URL!

configuration.load({
  awsConfig: {
    logoBucketUrl: `${awsEndpoint}/${configuration.get(
      'awsConfig.logoS3Bucket',
    )}`,
    imageBucketUrl: `${awsEndpoint}/${configuration.get(
      'awsConfig.imageS3Bucket',
    )}`,
    // NOTE THE TRAILING / AT THE END OF THIS URL! This is only for attachments!
    attachmentBucketUrl: `${awsEndpoint}/${configuration.get(
      'awsConfig.attachmentS3Bucket',
    )}/`,
  },
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

const dbConfig: DbConfig = {
  uri: configuration.get('dbHost'),
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
  const mailFrom = configuration.get('mail.from')
  const mailer = {
    from: `${configuration.get('appConfig.title')} <${mailFrom}>`,
  }

  // Creating mail transport
  let transporter: Mail
  if (!isDev) {
    // Throw error if env vars not present
    prodOnlyConfig.validate({ allowed: 'strict' })

    const options: SMTPPool.Options = {
      host: prodOnlyConfig.get('ses.host'),
      auth: {
        user: prodOnlyConfig.get('ses.user'),
        pass: prodOnlyConfig.get('ses.pass'),
      },
      port: prodOnlyConfig.get('ses.port'),
      // Options as advised from https://nodemailer.com/usage/bulk-mail/
      // pool connections instead of creating fresh one for each email
      pool: true,
      maxMessages: configuration.get('ses.maxMessages'),
      maxConnections: configuration.get('ses.maxConnections'),
      socketTimeout: configuration.get('ses.socketTimeout'),
      // If set to true then logs to console. If value is not set or is false
      // then nothing is logged.
      logger: configuration.get('mail.logger'),
      // If set to true, then logs SMTP traffic, otherwise logs only transaction
      // events.
      debug: configuration.get('mail.debug'),
    }
    transporter = nodemailer.createTransport(options)
  } else if (prodOnlyConfig.get('ses.port')) {
    logger.warn({
      message:
        '\n!!! WARNING !!!\nNo SES credentials detected.\nUsing Nodemailer to send to local SMTP server instead.\nThis should NEVER be seen in production.',
      meta: {
        action: 'init.mailConfig',
      },
    })
    transporter = nodemailer.createTransport({
      port: prodOnlyConfig.get('ses.port'),
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
    // Convert to async function, then call and await
    await promisify(aws.config.getCredentials)()
  }
  // In dev environment, credentials should be set from env vars
  if (!aws.config.credentials.accessKeyId) {
    throw new Error(`AWS Access Key Id is missing`)
  }
  if (!aws.config.credentials.secretAccessKey) {
    throw new Error(`AWS Secret Access Key is missing`)
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
  customCloudWatchGroup: configuration.get('customCloudWatchGroup'),
  sessionSecret: configuration.get('sessionSecret'),
  otpLifeSpan: configuration.get('otpLifeSpan'),
  bounceLifeSpan: configuration.get('bounceLifeSpan'),
  formsgSdkMode: configuration.get('formsgSdkMode'),
  chromiumBin: configuration.get('chromiumBin'),
  cspReportUri: configuration.get('cspReportUri'),
  submissionsTopUp: configuration.get('submissionsTopUp'),
  isGeneralMaintenance: configuration.get('banner.isGeneralMaintenance'),
  isLoginBanner: configuration.get('banner.isLoginBanner'),
  siteBannerContent: configuration.get('banner.siteBannerContent'),
  adminBannerContent: configuration.get('banner.adminBannerContent'),
  configureAws,
}

export = config
