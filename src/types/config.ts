import { PackageMode } from '@opengovsg/formsg-sdk/dist/types'
import aws from 'aws-sdk'
import { SessionOptions } from 'express-session'
import { ConnectionOptions } from 'mongoose'
import Mail from 'nodemailer/lib/mailer'

// Enums
export enum Environment {
  Dev = 'development',
  Prod = 'production',
  Test = 'test',
}

// Typings
export type AppConfig = {
  title: string
  description: string
  appUrl: string
  keywords: string
  images: string[]
  twitterImage: string
}

export type DbConfig = {
  uri: string
  options: ConnectionOptions
}

export type AwsConfig = {
  imageS3Bucket: string
  logoS3Bucket: string
  attachmentS3Bucket: string
  region: string
  logoBucketUrl: string
  imageBucketUrl: string
  attachmentBucketUrl: string
  staticAssetsBucketUrl: string
  s3: aws.S3
  endPoint: string
}

export type MailConfig = {
  mailFrom: string
  mailer: {
    from: string
  }
  official: string
  transporter: Mail
}

export type RateLimitConfig = {
  submissions: number
  sendAuthOtp: number
}

export type ReactMigrationConfig = {
  respondentRolloutEmail: number
  respondentRolloutStorage: number
  adminRollout: number
  respondentCookieName: string
  adminCookieNameOld: string
  adminCookieName: string
  qaCookieName: string
  adminSwitchEnvFeedbackFormId: string
  respondentSwitchEnvFeedbackFormId: string
  angularPhaseOutDate: string
  removeAdminInfoboxThreshold: number
  removeRespondentsInfoboxThreshold: number
}

export type Config = {
  app: AppConfig
  db: DbConfig
  aws: AwsConfig
  // TODO #130 Remove references to US SES when SES migration is over (opengovsg/formsg-private#130)
  mail_us: MailConfig
  mail_sg: MailConfig
  nodemailer_sg_warmup_start_date: string

  cookieSettings: SessionOptions['cookie']
  // Consts
  isDev: boolean
  nodeEnv: Environment
  port: number
  sessionSecret: string
  chromiumBin: string
  otpLifeSpan: number
  bounceLifeSpan: number
  formsgSdkMode: PackageMode
  submissionsTopUp: number
  customCloudWatchGroup: string
  isGeneralMaintenance: string
  isLoginBanner: string
  siteBannerContent: string
  adminBannerContent: string

  // TODO (#4279): Delete these when react migration is over. Revert back to original banner variables in react frontend.
  isGeneralMaintenanceReact: string
  isLoginBannerReact: string
  siteBannerContentReact: string
  adminBannerContentReact: string

  rateLimitConfig: RateLimitConfig
  reactMigration: ReactMigrationConfig
  secretEnv: string

  // Functions
  configureAws: () => Promise<void>
}

// Interface
export interface IProdOnlyVarsSchema {
  // TODO #130 Remove references to US SES when SES migration is over (opengovsg/formsg-private#130)
  port_us: number
  host_us: string
  user_us: string
  pass_us: string
  dbHost: string
  port_sg: number
  host_sg: string
  user_sg: string
  pass_sg: string
  nodemailer_sg_warmup_start_date: string
}

export interface ICompulsoryVarsSchema {
  core: {
    sessionSecret: string
    secretEnv: string
  }
  awsConfig: {
    imageS3Bucket: string
    staticAssetsS3Bucket: string
    logoS3Bucket: string
    attachmentS3Bucket: string
  }
  reactMigration: {
    adminSwitchEnvFeedbackFormId: string
    respondentSwitchEnvFeedbackFormId: string
  }
}

export interface ISgidVarsSchema {
  clientId: string
  clientSecret: string
  privateKeyPath: string
  publicKeyPath: string
  redirectUri: string
  cookieMaxAge: number
  cookieMaxAgePreserved: number
  cookieDomain: string
  hostname: string
}

export interface IOptionalVarsSchema {
  appConfig: AppConfig
  formsgSdkMode: PackageMode
  core: {
    port: number
    otpLifeSpan: number
    submissionsTopUp: number
    nodeEnv: Environment
  }
  banner: {
    isGeneralMaintenance: string
    isLoginBanner: string
    siteBannerContent: string
    adminBannerContent: string
    // TODO (#4279): Delete these when react migration is over. Revert back to original banner variables in react frontend.
    isGeneralMaintenanceReact: string
    isLoginBannerReact: string
    siteBannerContentReact: string
    adminBannerContentReact: string
  }
  awsConfig: {
    region: string
    customCloudWatchGroup: string
  }
  mail: {
    from: string
    official: string
    logger: boolean
    debug: boolean
    bounceLifeSpan: number
    chromiumBin: string
    maxMessages: number
    maxConnections: number
    socketTimeout: number
  }
  rateLimit: {
    submissions: number
    sendAuthOtp: number
  }
  reactMigration: {
    respondentRolloutEmail: number
    respondentRolloutStorage: number
    adminRollout: number
    respondentCookieName: string
    adminCookieNameOld: string
    adminCookieName: string
    qaCookieName: string
    angularPhaseOutDate: string
    removeAdminInfoboxThreshold: number
    removeRespondentsInfoboxThreshold: number
  }
}

export interface IBucketUrlSchema {
  attachmentBucketUrl: string
  logoBucketUrl: string
  imageBucketUrl: string
  staticAssetsBucketUrl: string
  endPoint: string
}
