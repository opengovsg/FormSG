import { PackageMode } from '@opengovsg/formsg-sdk/dist/types'

interface FrontendInjectedVariables {
  isGeneralMaintenance: string
  isLoginBanner: string
  siteBannerContent: string
  adminBannerContent: string
  logoBucketUrl: string
  formsgSdkMode: PackageMode
  captchaPublicKey: string | null
  sentryConfigUrl: string | null
  isSPMaintenance: string | null
  isCPMaintenance: string | null
  GATrackingID: string | null
  spcpCookieDomain: string | null
}

// NOTE: As these variables are not injected until runtime
// window is declared as any so that we can access the property without ts complaining
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formsgWindow: Window & FrontendInjectedVariables = window as any

export const injectedVariables: FrontendInjectedVariables = {
  isGeneralMaintenance: formsgWindow.isGeneralMaintenance,
  isLoginBanner: formsgWindow.isLoginBanner,
  siteBannerContent: formsgWindow.siteBannerContent,
  adminBannerContent: formsgWindow.adminBannerContent,
  logoBucketUrl: formsgWindow.logoBucketUrl, // S3 bucket
  formsgSdkMode: formsgWindow.formsgSdkMode,
  captchaPublicKey: formsgWindow.captchaPublicKey ?? null,
  sentryConfigUrl: formsgWindow.sentryConfigUrl ?? null,
  isSPMaintenance: formsgWindow.isSPMaintenance ?? null,
  isCPMaintenance: formsgWindow.isCPMaintenance ?? null,
  GATrackingID: formsgWindow.GATrackingID ?? null,
  spcpCookieDomain: formsgWindow.spcpCookieDomain ?? null,
}
