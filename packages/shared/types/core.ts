export type FrontendRuntimeEnv = {
  appUrl: string
  apiBaseUrl: string
  gaTrackingId: string
  formsgSdkMode: 'staging' | 'production' | 'development' | 'test'
  ddRumEnv: string
  ddSampleRate: number
  // Per-route Datadog session sampling, resolved server-side from growthbook.
  // Optional so older clients / dev fallbacks (apps/frontend/src/env.ts) keep
  // typechecking; consumers should default to 0 when absent.
  ddSampleRateAdmin?: number
  ddSampleRatePublic?: number
}

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
  isCPMaintenance: string // Corppass maintenance message
  myInfoBannerContent: string // MyInfo maintenance message

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
