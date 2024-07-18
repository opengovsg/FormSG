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
  turnstileSiteKey: string // Turnstile
  isSPMaintenance: string // Singpass maintenance message
  isCPMaintenance: string // Corppass maintenance message
  myInfoBannerContent: string // MyInfo maintenance message
  // TODO: remove after React rollout #4786
  GATrackingID: string | null

  spcpCookieDomain: string // Cookie domain used for removing spcp cookies
  stripePublishableKey: string
  maxPaymentAmountCents: number
  minPaymentAmountCents: number
  // TODO (#5826): Toggle to use fetch for submissions instead of axios. Remove once network error is resolved
  useFetchForSubmissions: boolean
  secretEnv: string
  goGovBaseUrl: string
  adminFeedbackFieldThreshold: number
  adminFeedbackDisplayFrequency: number
  growthbookClientKey: string
}
