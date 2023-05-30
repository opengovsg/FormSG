import { ClientEnvVars } from '../../../../shared/types/core'
import config from '../../config/config'
import { captchaConfig } from '../../config/features/captcha.config'
import { googleAnalyticsConfig } from '../../config/features/google-analytics.config'
import { paymentConfig } from '../../config/features/payment.config'
import { sentryConfig } from '../../config/features/sentry.config'
import { spcpMyInfoConfig } from '../../config/features/spcp-myinfo.config'

export const getClientEnvVars = (): ClientEnvVars => {
  return {
    isGeneralMaintenance: config.isGeneralMaintenance,
    isLoginBanner: config.isLoginBanner,
    siteBannerContent: config.siteBannerContent,
    adminBannerContent: config.adminBannerContent,
    logoBucketUrl: config.aws.logoBucketUrl, // S3 bucket
    formsgSdkMode: config.formsgSdkMode,
    captchaPublicKey: captchaConfig.captchaPublicKey, // Recaptcha
    sentryConfigUrl: sentryConfig.sentryConfigUrl, // Sentry.IO
    isSPMaintenance: spcpMyInfoConfig.isSPMaintenance, // Singpass maintenance message
    isCPMaintenance: spcpMyInfoConfig.isCPMaintenance, // Corppass maintenance message
    myInfoBannerContent: spcpMyInfoConfig.myInfoBannerContent, // MyInfo maintenance message
    // TODO: remove after React rollout #4786, #4279
    GATrackingID: googleAnalyticsConfig.GATrackingID,
    isGeneralMaintenanceReact: config.isGeneralMaintenanceReact,
    isLoginBannerReact: config.isLoginBannerReact,
    siteBannerContentReact: config.siteBannerContentReact,
    adminBannerContentReact: config.adminBannerContentReact,

    spcpCookieDomain: spcpMyInfoConfig.spcpCookieDomain, // Cookie domain used for removing spcp cookies
    stripePublishableKey: paymentConfig.stripePublishableKey,
    maxPaymentAmountCents: paymentConfig.maxPaymentAmountCents,
    minPaymentAmountCents: paymentConfig.minPaymentAmountCents,

    // TODO (#5826): Toggle to use fetch for submissions instead of axios. Remove once network error is resolved
    useFetchForSubmissions: config.reactMigration.useFetchForSubmissions,

    secretEnv: config.secretEnv, // Used for conditional rendering of payment copy

    paymentGuideLink: config.paymentGuideLink,
  }
}
