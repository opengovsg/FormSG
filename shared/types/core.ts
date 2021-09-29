export interface ErrorDto {
  message: string
}

export interface SuccessMessageDto {
  message: string
}

export interface PrivateFormErrorDto extends ErrorDto {
  isPageFound: true
  formTitle: string
}

// List of env vars expected from the server that client uses
export type ClientEnvVars = {
  isGeneralMaintenance: string
  isLoginBanner: string
  siteBannerContent: string
  adminBannerContent: string
  logoBucketUrl: string // S3 bucket
  formsgSdkMode: 'staging' | 'production' | 'development' | 'test'
  captchaPublicKey: string // Recaptcha
  sentryConfigUrl: string // Sentry.IO
  isSPMaintenance: string // Singpass maintenance message
  isCPMaintenance: string // Corppass maintenance message
  myInfoBannerContent: string // MyInfo maintenance message
  GATrackingID: string | null
  spcpCookieDomain: string // Cookie domain used for removing spcp cookies
}
