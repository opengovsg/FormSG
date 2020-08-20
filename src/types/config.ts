import { PackageMode } from '@opengovsg/formsg-sdk/dist/types'
import aws from 'aws-sdk'
import { SessionOptions } from 'express-session'
import { ConnectionOptions } from 'mongoose'
import Mail from 'nodemailer/lib/mailer'

// Typings
export type AppConfig = {
  title: string
  description: string
  appUrl: string
  keywords: string
  images: string[]
  twitterImage: string
}

// Enums
export enum Environment {
  Dev = 'development',
  Prod = 'production',
  Test = 'test',
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
  customCloudWatchGroup?: string
  isGeneralMaintenance?: string
  isLoginBanner?: string
  siteBannerContent?: string
  adminBannerContent?: string

  // Functions
  configureAws: () => Promise<void>
  otpGenerator: () => string
}
