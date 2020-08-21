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
}

export type MailConfig = {
  mailFrom: string
  mailer: {
    from: string
  }
  transporter: Mail
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
  cspReportUri: string
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

  // Functions
  configureAws: () => Promise<void>
  otpGenerator: () => string
}

// Interface
export interface ISesSchema {
  port: number
  host: string
  user: string
  pass: string
}

export interface IBasicSchema {
  appConfig: AppConfig
  formsgSdkMode: PackageMode
  core: {
    sessionSecret: string
    dbHost: string
    port: number
    otpLifeSpan: number
    submissionsTopUp: number
    cspReportUri: string
    nodeEnv: Environment
  }
  banner: {
    isGeneralMaintenance: string
    isLoginBanner: string
    siteBannerContent: string
    adminBannerContent: string
  }
  awsConfig: {
    imageS3Bucket: string
    logoS3Bucket: string
    attachmentS3Bucket: string
    region: string
    customCloudWatchGroup: string
  }
  mail: {
    from: string
    logger: boolean
    debug: boolean
    bounceLifeSpan: number
    chromiumBin: string
    maxMessages: number
    maxConnections: number
    socketTimeout: number
  }
}

export interface IBucketUrlSchema {
  attachmentBucketUrl: string
  logoBucketUrl: string
  imageBucketUrl: string
}
