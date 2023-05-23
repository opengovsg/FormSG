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
  downloadPaymentReceipt: number
}

export type ReactMigrationConfig = {
  // TODO (#5826): Toggle to use fetch for submissions instead of axios. Remove once network error is resolved
  useFetchForSubmissions: boolean
}

export type Config = {
  app: AppConfig
  db: DbConfig
  aws: AwsConfig
  mail: MailConfig
  cookieSettings: SessionOptions['cookie']
  // Consts
  isDev: boolean
  nodeEnv: Environment
  useMockTwilio: boolean
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
  envSiteName: string
  apiKeySalt: string

  // Functions
  configureAws: () => Promise<void>
}

// Interface
export interface IProdOnlyVarsSchema {
  port: number
  host: string
  user: string
  pass: string
  dbHost: string
}

export interface ICompulsoryVarsSchema {
  core: {
    sessionSecret: string
    secretEnv: string
    envSiteName: string
  }
  awsConfig: {
    imageS3Bucket: string
    staticAssetsS3Bucket: string
    logoS3Bucket: string
    attachmentS3Bucket: string
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
    useMockTwilio: boolean
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
    downloadPaymentReceipt: number
  }
  reactMigration: {
    // TODO (#5826): Toggle to use fetch for submissions instead of axios. Remove once network error is resolved
    useFetchForSubmissions: boolean
  }
  apiKeySalt: string
}

export interface IBucketUrlSchema {
  attachmentBucketUrl: string
  logoBucketUrl: string
  imageBucketUrl: string
  staticAssetsBucketUrl: string
  endPoint: string
}
