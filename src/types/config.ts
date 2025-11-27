import { Lambda } from '@aws-sdk/client-lambda'
import { PackageMode } from '@opengovsg/formsg-sdk/dist/types'
import aws from 'aws-sdk'
import { SessionOptions } from 'express-session'
import { ConnectOptions } from 'mongoose'
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
  feAppUrl: string
  keywords: string
  images: string[]
  twitterImage: string
}

export type DbConfig = {
  uri: string
  options: ConnectOptions
}

export type AwsConfig = {
  imageS3Bucket: string
  logoS3Bucket: string
  attachmentS3Bucket: string
  paymentProofS3Bucket: string
  region: string
  logoBucketUrl: string
  imageBucketUrl: string
  attachmentBucketUrl: string
  staticAssetsBucketUrl: string
  s3: aws.S3
  endPoint: string
  guarddutyQuarantineS3BucketUrl: string
  guarddutyQuarantineS3Bucket: string
  guarddutyCleanS3Bucket: string
  guarddutyLambda: Lambda
  guarddutyLambdaFunctionName: string
  // pdfGeneratorLambda
  pdfGeneratorLambda: Lambda
  pdfGeneratorLambdaFunctionName: string
}

export type MailConfig = {
  mailFrom: string
  mailer: {
    from: string
  }
  official: string
  transporter: Mail
  sesConfigSet: string
}

export type RateLimitConfig = {
  submissions: number
  sendAuthOtp: number
  publicFormIssueFeedback: number
  downloadPaymentReceipt: number
  downloadFormWhitelist: number
  uploadFormWhitelist: number
  publicApi: number
  platformApi: number
  makeTextPrompt: number
  makeVisionPrompt: number
  mrfPendingSubmissionEmailReminder: number
}

export type PublicApiConfig = {
  apiEnv: string
  apiKeyVersion: string
}

export type IacMigrationConfig = {
  isMigrated: boolean
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
  isTest: boolean
  isDevOrTest: boolean
  nodeEnv: Environment
  useMockPostmanSms: boolean
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
  iacMigration: IacMigrationConfig
  reactMigration: ReactMigrationConfig
  killEmailMode: IOptionalVarsSchema['killEmailMode']
  secretEnv: string
  envSiteName: string
  publicApiConfig: PublicApiConfig
  adminFeedbackFieldThreshold: number
  adminFeedbackDisplayFrequency: number

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
  sesConfigSet: string
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
    paymentProofS3Bucket: string
  }
}

export interface ISgidVarsSchema {
  clientId: string
  clientSecret: string
  privateKey: string
  publicKey: string
  privateKeyPath: string
  publicKeyPath: string
  formLoginRedirectUri: string
  adminLoginRedirectUri: string
  cookieMaxAge: number
  cookieMaxAgePreserved: number
  cookieDomain: string
  hostname: string
  jwtSecret: string
}

export interface ISsoVarsSchema {
  discoveryUrl: string
  clientId: string
  clientSecret: string
}

export interface IOptionalVarsSchema {
  appConfig: AppConfig
  formsgSdkMode: PackageMode
  core: {
    port: number
    otpLifeSpan: number
    submissionsTopUp: number
    nodeEnv: Environment
    useMockPostmanSms: boolean
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
    guarddutyQuarantineS3Bucket: string
    guarddutyCleanS3Bucket: string
    guarddutyLambdaFunctionName: string
    guarddutyLambdaEndpoint: string
    pdfGeneratorLambdaFunctionName: string
    pdfGeneratorLambdaEndpoint: string
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
    publicFormIssueFeedback: number
    downloadPaymentReceipt: number
    downloadFormWhitelist: number
    uploadFormWhitelist: number
    publicApi: number
    platformApi: number
    makeTextPrompt: number
    makeVisionPrompt: number
    mrfPendingSubmissionEmailReminder: number
  }
  iacMigration: {
    // TODO: (IaC Migration) Remove this after IaC migration is fully completed
    isMigrated: boolean
  }
  reactMigration: {
    // TODO (#5826): Toggle to use fetch for submissions instead of axios. Remove once network error is resolved
    useFetchForSubmissions: boolean
  }
  killEmailMode: {
    feedbackFormId: string
  }
  publicApi: {
    apiKeyVersion: string
  }
  adminFeedback: {
    adminFeedbackFieldThreshold: number
    adminFeedbackDisplayFrequency: number
  }
}

export interface IBucketUrlSchema {
  attachmentBucketUrl: string
  logoBucketUrl: string
  imageBucketUrl: string
  staticAssetsBucketUrl: string
  paymentProofS3BucketUrl: string
  endPoint: string
  guarddutyQuarantineS3BucketUrl: string
}
