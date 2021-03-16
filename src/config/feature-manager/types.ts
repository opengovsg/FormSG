import { MyInfoMode } from '@opengovsg/myinfo-gov-client'
import { Schema } from 'convict'

export enum FeatureNames {
  AggregateStats = 'aggregate-stats',
  Captcha = 'captcha',
  GoogleAnalytics = 'google-analytics',
  Sentry = 'sentry',
  Sms = 'sms',
  SpcpMyInfo = 'spcp-myinfo',
  VerifiedFields = 'verified-fields',
  WebhookVerifiedContent = 'webhook-verified-content',
}

export interface IAggregateStats {
  aggregateCollection: string
}

export interface ICaptcha {
  captchaPrivateKey: string
  captchaPublicKey: string
}

export interface IGoogleAnalytics {
  GATrackingID: string
}

export interface ISentry {
  sentryConfigUrl: string
  cspReportUri: string
}

export interface ISms {
  twilioAccountSid: string
  twilioApiKey: string
  twilioApiSecret: string
  twilioMsgSrvcSid: string
}

export interface ISpcpConfig {
  isSPMaintenance: string
  isCPMaintenance: string
  spCookieMaxAge: number
  spCookieMaxAgePreserved: number
  spcpCookieDomain: string
  cpCookieMaxAge: number
  spIdpId: string
  cpIdpId: string
  spPartnerEntityId: string
  cpPartnerEntityId: string
  spIdpLoginUrl: string
  cpIdpLoginUrl: string
  spIdpEndpoint: string
  cpIdpEndpoint: string
  spEsrvcId: string
  cpEsrvcId: string
  spFormSgKeyPath: string
  cpFormSgKeyPath: string
  spFormSgCertPath: string
  cpFormSgCertPath: string
  spIdpCertPath: string
  cpIdpCertPath: string
}

export interface IMyInfoConfig {
  myInfoClientMode: MyInfoMode
  myInfoKeyPath: string
  myInfoCertPath: string
  myInfoClientId: string
  myInfoClientSecret: string
  // TODO (private #123): remove these keys
  cpCloudFormId: string
  cpCloudEndpoint: string
  cpCloudCertPath: string
}

export type ISpcpMyInfo = ISpcpConfig & IMyInfoConfig

export interface IVerifiedFields {
  verificationSecretKey: string
}

export interface IWebhookVerifiedContent {
  signingSecretKey: string
}

export interface IFeatureManager {
  [FeatureNames.AggregateStats]: IAggregateStats
  [FeatureNames.Captcha]: ICaptcha
  [FeatureNames.GoogleAnalytics]: IGoogleAnalytics
  [FeatureNames.Sentry]: ISentry
  [FeatureNames.Sms]: ISms
  [FeatureNames.SpcpMyInfo]: ISpcpMyInfo
  [FeatureNames.VerifiedFields]: IVerifiedFields
  [FeatureNames.WebhookVerifiedContent]: IWebhookVerifiedContent
}

export interface RegisteredFeature<T extends FeatureNames> {
  isEnabled: boolean
  props?: IFeatureManager[T]
}

export interface RegisterableFeature<K extends FeatureNames> {
  name: K
  schema: Schema<IFeatureManager[K]>
}
