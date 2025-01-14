import { Lambda } from '@aws-sdk/client-lambda'
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
  PublicApiConfig,
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

const isDev = basicVars.core.nodeEnv === Environment.Dev
const isTest = basicVars.core.nodeEnv === Environment.Test
const isDevOrTest = isDev || isTest
const nodeEnv = isDevOrTest ? basicVars.core.nodeEnv : Environment.Prod

// Load and validate configuration values which are compulsory only in production
// If environment variables are not present, an error will be thrown
// They may still be referenced in development
let prodOnlyVars
if (isDevOrTest) {
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
  isDev: isDevOrTest,
  region: basicVars.awsConfig.region,
})
const awsEndpoint = convict(s3BucketUrlSchema).getProperties().endPoint
const s3BucketUrlVars = convict(s3BucketUrlSchema)
  .load({
    logoBucketUrl: `${awsEndpoint}/${basicVars.awsConfig.logoS3Bucket}`,
    imageBucketUrl: `${awsEndpoint}/${basicVars.awsConfig.imageS3Bucket}`,
    staticAssetsBucketUrl: `${awsEndpoint}/${basicVars.awsConfig.staticAssetsS3Bucket}`,
    // NOTE THE TRAILING / AT THE END OF THIS URL! This is only for attachments!
    attachmentBucketUrl: `${awsEndpoint}/${basicVars.awsConfig.attachmentS3Bucket}/`,
    virusScannerQuarantineS3BucketUrl: `${awsEndpoint}/${basicVars.awsConfig.virusScannerQuarantineS3Bucket}`,
    paymentProofS3BucketUrl: `${awsEndpoint}/${basicVars.awsConfig.paymentProofS3Bucket}`,
  })
  .validate({ allowed: 'strict' })
  .getProperties()

const hasR2Buckets = Object.values(s3BucketUrlVars).some((url) =>
  /https:\/\/\w+\.r2\.cloudflarestorage\.com/i.test(url),
)

const s3 = new aws.S3({
  region: basicVars.awsConfig.region,
  // Unset and use default if not in development mode
  // Endpoint and path style overrides are needed only in development mode
  // for localstack to work, or for Cloudflare R2.
  endpoint: isDevOrTest || hasR2Buckets ? s3BucketUrlVars.endPoint : undefined,
  s3ForcePathStyle: isDevOrTest || hasR2Buckets ? true : undefined,
})

// using aws-sdk v3 (FRM-993)
const virusScannerLambda = new Lambda({
  region: basicVars.awsConfig.region,
  // For dev mode or where specified, endpoint is set to point to the separate docker container running the lambda function.
  // host.docker.internal is a special DNS name which resolves to the internal IP address used by the host.
  // Reference: https://docs.docker.com/desktop/networking/#i-want-to-connect-from-a-container-to-a-service-on-the-host
  ...(isDevOrTest || basicVars.awsConfig.virusScannerLambdaEndpoint
    ? {
        endpoint:
          basicVars.awsConfig.virusScannerLambdaEndpoint ||
          'http://host.docker.internal:9999',
      }
    : undefined),
})

const awsConfig: AwsConfig = {
  ...s3BucketUrlVars,
  ...basicVars.awsConfig,
  s3,
  virusScannerLambda,
}

let dbUri: string | undefined
if (isDevOrTest) {
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
    autoIndex: isDevOrTest,
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
  if (!isDevOrTest) {
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
    sesConfigSet: prodOnlyVars.sesConfigSet,
  }
})()

// Cookie settings needed for express-session configuration
const cookieSettings: SessionOptions['cookie'] = {
  httpOnly: true, // JavaScript will not be able to read the cookie in case of XSS exploitation
  secure: !isDevOrTest, // true prevents cookie from being accessed over http
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  sameSite: 'strict', // Cookie will not be sent if navigating from another domain
}

/**
 * Fetches AWS credentials
 */
const configureAws = async () => {
  if (!isDevOrTest) {
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

const apiEnv = isDevOrTest ? 'test' : 'live'
const publicApiConfig: PublicApiConfig = {
  apiEnv,
  apiKeyVersion: basicVars.publicApi.apiKeyVersion,
}

const config: Config = {
  app: basicVars.appConfig,
  db: dbConfig,
  aws: awsConfig,
  mail: mailConfig,
  cookieSettings,
  isDev,
  isTest,
  isDevOrTest,
  useMockPostmanSms: basicVars.core.useMockPostmanSms,
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
  rateLimitConfig: basicVars.rateLimit,
  reactMigration: basicVars.reactMigration,
  configureAws,
  secretEnv: basicVars.core.secretEnv,
  envSiteName: basicVars.core.envSiteName,
  publicApiConfig,
  adminFeedbackFieldThreshold:
    basicVars.adminFeedback.adminFeedbackFieldThreshold,
  adminFeedbackDisplayFrequency:
    basicVars.adminFeedback.adminFeedbackDisplayFrequency,
}

export = config
