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

import { AwsConfig, Config, DbConfig, Environment, MailConfig } from '../types'

import defaults from './defaults'
import { createLoggerWithLabel } from './logger'
import { basicSchema, loadS3BucketUrlSchema, sesSchema } from './schema'

// Perform validation before accessing basic env vars
const basicVars = convict(basicSchema)
basicVars.validate({ allowed: 'strict' })

const isDev =
  basicVars.get('core.nodeEnv') === Environment.Dev ||
  basicVars.get('core.nodeEnv') === Environment.Test
const nodeEnv = isDev ? Environment.Dev : Environment.Prod

// Construct bucket URLs depending on node environment
// If in development env, endpoint communicates with localstack, a fully
// functional local AWS cloud stack for hosting images/logos/attachments.
// Else, the environment variables to instantiate S3 are used.

const awsEndpoint = isDev
  ? defaults.aws.endpoint
  : `https://s3.${basicVars.get('awsConfig.region')}.amazonaws.com` // NOTE NO TRAILING / AT THE END OF THIS URL!

// Perform validation before accessing s3 Bucket Urls
const s3BucketUrlSchema = loadS3BucketUrlSchema(isDev)
const s3BucketUrlVars = convict(s3BucketUrlSchema)
s3BucketUrlVars.load({
  logoBucketUrl: `${awsEndpoint}/${basicVars.get('awsConfig.logoS3Bucket')}`,
  imageBucketUrl: `${awsEndpoint}/${basicVars.get('awsConfig.imageS3Bucket')}`,
  // NOTE THE TRAILING / AT THE END OF THIS URL! This is only for attachments!
  attachmentBucketUrl: `${awsEndpoint}/${basicVars.get(
    'awsConfig.attachmentS3Bucket',
  )}/`,
})
s3BucketUrlVars.validate({ allowed: 'strict' })

const s3 = new aws.S3({
  region: basicVars.get('awsConfig.region'),
  // Unset and use default if not in development mode
  // Endpoint and path style overrides are needed only in development mode for
  // localstack to work.
  endpoint: isDev ? defaults.aws.endpoint : undefined,
  s3ForcePathStyle: isDev ? true : undefined,
})

const awsConfig: AwsConfig = {
  ...s3BucketUrlVars.getProperties(),
  ...basicVars.get('awsConfig'),
  s3,
}

const logger = createLoggerWithLabel(module)

const dbConfig: DbConfig = {
  uri: basicVars.get('core.dbHost') || undefined,
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

// Perform validation before accessing ses config
const sesVars = convict(sesSchema)
if (!isDev) {
  sesVars.validate({ allowed: 'strict' })
}

const mailConfig: MailConfig = (function () {
  const mailFrom = basicVars.get('mail.from')
  const mailer = {
    from: `${basicVars.get('appConfig.title')} <${mailFrom}>`,
  }

  // Creating mail transport
  let transporter: Mail
  if (!isDev) {
    const options: SMTPPool.Options = {
      host: sesVars.get('host'),
      auth: {
        user: sesVars.get('user'),
        pass: sesVars.get('pass'),
      },
      port: sesVars.get('port'),
      // Options as advised from https://nodemailer.com/usage/bulk-mail/
      // pool connections instead of creating fresh one for each email
      pool: true,
      maxMessages: basicVars.get('mail.maxMessages'),
      maxConnections: basicVars.get('mail.maxConnections'),
      socketTimeout: basicVars.get('mail.socketTimeout'),
      // If set to true then logs to console. If value is not set or is false
      // then nothing is logged.
      logger: basicVars.get('mail.logger'),
      // If set to true, then logs SMTP traffic, otherwise logs only transaction
      // events.
      debug: basicVars.get('mail.debug'),
    }
    transporter = nodemailer.createTransport(options)
  } else {
    if (basicVars.get('core.nodeEnv') === Environment.Dev) {
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
      basicVars.get('core.nodeEnv') === Environment.Test &&
      sesVars.get('port')
    ) {
      logger.warn({
        message:
          '\n!!! WARNING !!!\nNo SES credentials detected.\nUsing Nodemailer Direct Transport instead.\nThis should NEVER be seen in production.',
        meta: {
          action: 'init.mailConfig',
        },
      })
      transporter = nodemailer.createTransport({
        port: sesVars.get('port'),
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

// Cookie settings needed for express-session configuration
const cookieSettings: SessionOptions['cookie'] = {
  httpOnly: true, // JavaScript will not be able to read the cookie in case of XSS exploitation
  secure: !isDev, // true prevents cookie from being accessed over http
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  sameSite: 'strict', // Cookie will not be sent if navigating from another domain
}

/**
 * Fetches AWS credentials
 */
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
  app: basicVars.get('appConfig'),
  db: dbConfig,
  aws: awsConfig,
  mail: mailConfig,
  cookieSettings,
  isDev,
  nodeEnv,
  formsgSdkMode: basicVars.get('formsgSdkMode'),
  customCloudWatchGroup: basicVars.get('awsConfig.customCloudWatchGroup'),
  bounceLifeSpan: basicVars.get('mail.bounceLifeSpan'),
  chromiumBin: basicVars.get('mail.chromiumBin'),
  port: basicVars.get('core.port'),
  sessionSecret: basicVars.get('core.sessionSecret'),
  otpLifeSpan: basicVars.get('core.otpLifeSpan'),
  cspReportUri: basicVars.get('core.cspReportUri'),
  submissionsTopUp: basicVars.get('core.submissionsTopUp'),
  isGeneralMaintenance: basicVars.get('banner.isGeneralMaintenance'),
  isLoginBanner: basicVars.get('banner.isLoginBanner'),
  siteBannerContent: basicVars.get('banner.siteBannerContent'),
  adminBannerContent: basicVars.get('banner.adminBannerContent'),
  configureAws,
}

export = config
