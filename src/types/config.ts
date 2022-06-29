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

export type Config = {
  app: AppConfig
  db: DbConfig
  aws: AwsConfig
  mail: MailConfig

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
  rateLimitConfig: RateLimitConfig
  secretEnv: string

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
  }
  awsConfig: {
    imageS3Bucket: string
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
}

export interface IBucketUrlSchema {
  attachmentBucketUrl: string
  logoBucketUrl: string
  imageBucketUrl: string
  endPoint: string
}
