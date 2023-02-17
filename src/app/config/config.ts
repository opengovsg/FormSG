import aws from 'aws-sdk'
import convict from 'convict'
import { SessionOptions } from 'express-session'
import { merge } from 'lodash'
import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'
import SMTPPool from 'nodemailer/lib/smtp-pool'

import {
  AwsConfig,
  Config,
  DbConfig,
  Environment,
  MailConfig,
} from '../../types'

import {
  compulsoryVarsSchema,
  loadS3BucketUrlSchema,
  optionalVarsSchema,
  prodOnlyVarsSchema,
} from './schema'

// Load and validate optional configuration values
// If environment variables are not present, defaults are loaded
const optionalVars = convict(optionalVarsSchema)
  .validate({ allowed: 'strict' })
  .getProperties()

// Load and validate compulsory configuration values
// If environment variables are not present, an error will be thrown
const compulsoryVars = convict(compulsoryVarsSchema)
  .validate({ allowed: 'strict' })
  .getProperties()

// Deep merge nested objects optionalVars and compulsoryVars
const basicVars = merge(optionalVars, compulsoryVars)

const isDev =
  basicVars.core.nodeEnv === Environment.Dev ||
  basicVars.core.nodeEnv === Environment.Test
const nodeEnv = isDev ? basicVars.core.nodeEnv : Environment.Prod

// Load and validate configuration values which are compulsory only in production
// If environment variables are not present, an error will be thrown
// They may still be referenced in development
let prodOnlyVars
if (isDev) {
  prodOnlyVars = convict(prodOnlyVarsSchema).getProperties()
} else {
  // Perform validation before accessing ses config
  prodOnlyVars = convict(prodOnlyVarsSchema)
    .validate({ allowed: 'strict' })
    .getProperties()
}

// Construct bucket URLs depending on node environment
// If in development env, endpoint communicates with localstack, a fully
// functional local AWS cloud stack for hosting images/logos/attachments.
// Else, the environment variables to instantiate S3 are used.

// Perform validation before accessing s3 Bucket Urls
const s3BucketUrlSchema = loadS3BucketUrlSchema({
  isDev,
  region: basicVars.awsConfig.region,
})
const awsEndpoint = convict(s3BucketUrlSchema).getProperties().endPoint
const s3BucketUrlVars = convict(s3BucketUrlSchema)
  .load({
    logoBucketUrl: `${awsEndpoint}/${basicVars.awsConfig.logoS3Bucket}`,
    imageBucketUrl: `${awsEndpoint}/${basicVars.awsConfig.imageS3Bucket}`,
    // NOTE THE TRAILING / AT THE END OF THIS URL! This is only for attachments!
    attachmentBucketUrl: `${awsEndpoint}/${basicVars.awsConfig.attachmentS3Bucket}/`,
  })
  .validate({ allowed: 'strict' })
  .getProperties()

const s3 = new aws.S3({
  region: basicVars.awsConfig.region,
  // Unset and use default if not in development mode
  // Endpoint and path style overrides are needed only in development mode for
  // localstack to work.
  endpoint: isDev ? s3BucketUrlVars.endPoint : undefined,
  s3ForcePathStyle: isDev ? true : undefined,
})

const awsConfig: AwsConfig = {
  ...s3BucketUrlVars,
  ...basicVars.awsConfig,
  s3,
}

let dbUri: string | undefined
if (isDev) {
  if (basicVars.core.nodeEnv === Environment.Dev && prodOnlyVars.dbHost) {
    dbUri = prodOnlyVars.dbHost
  } else if (basicVars.core.nodeEnv === Environment.Test) {
    dbUri = undefined
  } else {
    throw new Error('Database configuration missing')
  }
} else {
  dbUri = prodOnlyVars.dbHost
}

const dbConfig: DbConfig = {
  uri: dbUri ?? '',
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
  const mailFrom = basicVars.mail.from
  const official = basicVars.mail.official
  const mailer = {
    from: `${basicVars.appConfig.title} <${mailFrom}>`,
  }

  // Creating mail transport
  let transporter: Mail
  if (!isDev) {
    const options: SMTPPool.Options = {
      host: prodOnlyVars.host,
      auth: {
        user: prodOnlyVars.user,
        pass: prodOnlyVars.pass,
      },
      port: prodOnlyVars.port,
      // Options as advised from https://nodemailer.com/usage/bulk-mail/
      // pool connections instead of creating fresh one for each email
      pool: true,
      maxMessages: basicVars.mail.maxMessages,
      maxConnections: basicVars.mail.maxConnections,
      socketTimeout: basicVars.mail.socketTimeout,
      // If set to true then logs to console. If value is not set or is false
      // then nothing is logged.
      logger: basicVars.mail.logger,
      // If set to true, then logs SMTP traffic, otherwise logs only transaction
      // events.
      debug: basicVars.mail.debug,
    }
    transporter = nodemailer.createTransport(options)
  } else {
    transporter = nodemailer.createTransport({
      port: prodOnlyVars.port,
      host: prodOnlyVars.host,
      ignoreTLS: true,
    })
  }

  return {
    mailFrom,
    official,
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
      return new Promise<void>((resolve, reject) => {
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
    if (!aws.config.credentials?.accessKeyId) {
      throw new Error(`AWS Access Key Id is missing`)
    }
    if (!aws.config.credentials?.secretAccessKey) {
      throw new Error(`AWS Secret Access Key is missing`)
    }
  }
}

const config: Config = {
  app: basicVars.appConfig,
  db: dbConfig,
  aws: awsConfig,
  mail: mailConfig,
  cookieSettings,
  isDev,
  nodeEnv,
  formsgSdkMode: basicVars.formsgSdkMode,
  customCloudWatchGroup: basicVars.awsConfig.customCloudWatchGroup,
  bounceLifeSpan: basicVars.mail.bounceLifeSpan,
  chromiumBin: basicVars.mail.chromiumBin,
  port: basicVars.core.port,
  sessionSecret: basicVars.core.sessionSecret,
  otpLifeSpan: basicVars.core.otpLifeSpan,
  submissionsTopUp: basicVars.core.submissionsTopUp,
  isGeneralMaintenance: basicVars.banner.isGeneralMaintenance,
  isLoginBanner: basicVars.banner.isLoginBanner,
  siteBannerContent: basicVars.banner.siteBannerContent,
  adminBannerContent: basicVars.banner.adminBannerContent,
  // TODO (#4279): Delete these when react migration is over. Revert back to original banner variables in react frontend.
  isGeneralMaintenanceReact: basicVars.banner.isGeneralMaintenanceReact,
  isLoginBannerReact: basicVars.banner.isLoginBannerReact,
  siteBannerContentReact: basicVars.banner.siteBannerContentReact,
  adminBannerContentReact: basicVars.banner.adminBannerContentReact,
  rateLimitConfig: basicVars.rateLimit,
  reactMigration: basicVars.reactMigration,
  configureAws,
  secretEnv: basicVars.core.secretEnv,
}

export = config
