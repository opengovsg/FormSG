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
import { basicSchema, loadS3BucketUrlSchema, sesSchema } from './schema'

// Perform validation before accessing basic env vars
const basicConfig = convict(basicSchema)
basicConfig.validate({ allowed: 'strict' })

const isDev =
  basicConfig.get('core.nodeEnv') === Environment.Dev ||
  basicConfig.get('core.nodeEnv') === Environment.Test
const nodeEnv = isDev ? Environment.Dev : Environment.Prod

// Construct bucket URLs depending on node environment
// If in development env, endpoint communicates with localstack, a fully
// functional local AWS cloud stack for hosting images/logos/attachments.
// Else, the environment variables to instantiate S3 are used.

const s3BucketUrlSchema = loadS3BucketUrlSchema(isDev)
const s3BucketUrlConfig = convict(s3BucketUrlSchema)

const awsEndpoint = isDev
  ? defaults.aws.endpoint
  : `https://s3.${basicConfig.get('awsConfig.region')}.amazonaws.com` // NOTE NO TRAILING / AT THE END OF THIS URL!

s3BucketUrlConfig.load({
  logoBucketUrl: `${awsEndpoint}/${basicConfig.get('awsConfig.logoS3Bucket')}`,
  imageBucketUrl: `${awsEndpoint}/${basicConfig.get(
    'awsConfig.imageS3Bucket',
  )}`,
  // NOTE THE TRAILING / AT THE END OF THIS URL! This is only for attachments!
  attachmentBucketUrl: `${awsEndpoint}/${basicConfig.get(
    'awsConfig.attachmentS3Bucket',
  )}/`,
})

// Perform validation before accessing s3 Bucket Urls
s3BucketUrlConfig.validate({ allowed: 'strict' })

const s3 = new aws.S3({
  region: basicConfig.get('awsConfig.region'),
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
  uri: basicConfig.get('core.dbHost'),
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

const sesConfig = convict(sesSchema)

const mailConfig: MailConfig = (function () {
  const mailFrom = basicConfig.get('mail.from')
  const mailer = {
    from: `${basicConfig.get('appConfig.title')} <${mailFrom}>`,
  }

  // Creating mail transport
  let transporter: Mail
  if (!isDev) {
    // Throw error if ses env vars not present
    sesConfig.validate({ allowed: 'strict' })

    const options: SMTPPool.Options = {
      host: sesConfig.get('ses.host'),
      auth: {
        user: sesConfig.get('ses.user'),
        pass: sesConfig.get('ses.pass'),
      },
      port: sesConfig.get('ses.port'),
      // Options as advised from https://nodemailer.com/usage/bulk-mail/
      // pool connections instead of creating fresh one for each email
      pool: true,
      maxMessages: basicConfig.get('mail.maxMessages'),
      maxConnections: basicConfig.get('mail.maxConnections'),
      socketTimeout: basicConfig.get('mail.socketTimeout'),
      // If set to true then logs to console. If value is not set or is false
      // then nothing is logged.
      logger: basicConfig.get('mail.logger'),
      // If set to true, then logs SMTP traffic, otherwise logs only transaction
      // events.
      debug: basicConfig.get('mail.debug'),
    }
    transporter = nodemailer.createTransport(options)
  } else {
    if (basicConfig.get('core.nodeEnv') === Environment.Dev) {
      logger.warn({
        message:
          '\n!!! WARNING !!!\nNo SES credentials detected.\nUsing Nodemailer to send to local SMTP server instead.\nThis should NEVER be seen in production.',
        meta: {
          action: 'init.mailConfig',
        },
      })
      // Falls back to direct transport
      transporter = nodemailer.createTransport(directTransport({}))
    } else if (
      basicConfig.get('core.nodeEnv') === Environment.Test &&
      sesConfig.get('ses.port')
    ) {
      logger.warn({
        message:
          '\n!!! WARNING !!!\nNo SES credentials detected.\nUsing Nodemailer Direct Transport instead.\nThis should NEVER be seen in production.',
        meta: {
          action: 'init.mailConfig',
        },
      })
      transporter = nodemailer.createTransport({
        port: sesConfig.get('ses.port'),
        ignoreTLS: true,
      })
    } else {
      throw new Error('Nodemailer configuration is missing')
    }
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
  app: basicConfig.get('appConfig'),
  db: dbConfig,
  aws: {
    ...s3BucketUrlConfig.getProperties(),
    ...basicConfig.get('awsConfig'),
    s3,
  },
  mail: mailConfig,
  cookieSettings,
  isDev,
  nodeEnv,
  formsgSdkMode: basicConfig.get('formsgSdkMode'),
  customCloudWatchGroup: basicConfig.get('awsConfig.customCloudWatchGroup'),
  bounceLifeSpan: basicConfig.get('mail.bounceLifeSpan'),
  chromiumBin: basicConfig.get('mail.chromiumBin'),
  port: basicConfig.get('core.port'),
  sessionSecret: basicConfig.get('core.sessionSecret'),
  otpLifeSpan: basicConfig.get('core.otpLifeSpan'),
  cspReportUri: basicConfig.get('core.cspReportUri'),
  submissionsTopUp: basicConfig.get('core.submissionsTopUp'),
  isGeneralMaintenance: basicConfig.get('banner.isGeneralMaintenance'),
  isLoginBanner: basicConfig.get('banner.isLoginBanner'),
  siteBannerContent: basicConfig.get('banner.siteBannerContent'),
  adminBannerContent: basicConfig.get('banner.adminBannerContent'),
  configureAws,
}

export = config
