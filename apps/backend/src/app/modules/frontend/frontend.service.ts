import { GrowthBook } from '@growthbook/growthbook'
import { ClientEnvVars, FrontendRuntimeEnv } from 'formsg-shared/types/core'
import { readFileSync } from 'fs'
import path from 'path'

import config from '../../config/config'
import { captchaConfig } from '../../config/features/captcha.config'
import { goGovConfig } from '../../config/features/gogov.config'
import {
  growthbookConfig,
  GrowthbookFeature,
} from '../../config/features/growthbook.config'
import { paymentConfig } from '../../config/features/payment.config'
import { spcpMyInfoConfig } from '../../config/features/spcp-myinfo.config'
import { turnstileConfig } from '../../config/features/turnstile.config'

// Version of the deployed backend, read once at startup from the backend's
// own package.json. Resolved relative to cwd (apps/backend), matching how the
// controller resolves the frontend dist; present in both dev and the
// production image (see Dockerfile.production). The frontend compares this
// against the version baked into its bundle to detect stale bundles after a
// deploy.
const readAppVersion = (): string => {
  try {
    const { version } = JSON.parse(
      readFileSync(path.resolve('package.json'), { encoding: 'utf8' }),
    ) as { version?: string }
    return version ?? ''
  } catch {
    return ''
  }
}
export const appVersion = readAppVersion()

export const getFrontendRuntimeEnv = (
  growthbook?: GrowthBook,
): FrontendRuntimeEnv => ({
  appUrl: config.app.appUrl,
  apiBaseUrl: '/api/v3',
  gaTrackingId: process.env.GA_TRACKING_ID ?? '',
  formsgSdkMode: config.formsgSdkMode,
  ddRumEnv: process.env.DD_ENV ?? '',
  ddSampleRate: 5,
  ddSampleRateAdmin:
    growthbook?.getFeatureValue<number>(
      GrowthbookFeature.DD_SAMPLE_RATE_ADMIN,
      0,
    ) ?? 0,
  ddSampleRatePublic:
    growthbook?.getFeatureValue<number>(
      GrowthbookFeature.DD_SAMPLE_RATE_PUBLIC,
      0,
    ) ?? 0,
})

const serializeForInlineScript = (value: FrontendRuntimeEnv): string =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')

// Built per-request because growthbook flag values can vary; the inline script
// is allowed by CSP via the request-scoped nonce (see CSP_CORE_DIRECTIVES).
export const getEnvScriptHtml = ({
  growthbook,
  nonce,
}: {
  growthbook?: GrowthBook
  nonce: string
}): string =>
  `<script nonce="${nonce}">window.__ENV__=${serializeForInlineScript(
    getFrontendRuntimeEnv(growthbook),
  )}</script>`

export const getClientEnvVars = (): ClientEnvVars => {
  return {
    // Used by the frontend to detect when its loaded bundle is a breaking
    // (major) version behind the deployed backend, and prompt a refresh.
    appVersion,
    isGeneralMaintenance: config.isGeneralMaintenance,
    isLoginBanner: config.isLoginBanner,
    siteBannerContent: config.siteBannerContent,
    adminBannerContent: config.adminBannerContent,
    logoBucketUrl: config.aws.logoBucketUrl, // S3 bucket
    formsgSdkMode: config.formsgSdkMode,
    captchaPublicKey: captchaConfig.captchaPublicKey, // Recaptcha
    turnstileSiteKey: turnstileConfig.turnstileSiteKey,
    isSPMaintenance: spcpMyInfoConfig.isSPMaintenance, // Singpass maintenance message
    isCPMaintenance: spcpMyInfoConfig.isCPMaintenance, // Corppass maintenance message
    myInfoBannerContent: spcpMyInfoConfig.myInfoBannerContent, // MyInfo maintenance message
    spcpCookieDomain: spcpMyInfoConfig.spcpCookieDomain, // Cookie domain used for removing spcp cookies
    stripePublishableKey: paymentConfig.stripePublishableKey,
    maxPaymentAmountCents: paymentConfig.maxPaymentAmountCents,
    minPaymentAmountCents: paymentConfig.minPaymentAmountCents,

    // TODO (#5826): Toggle to use fetch for submissions instead of axios. Remove once network error is resolved
    useFetchForSubmissions: config.reactMigration.useFetchForSubmissions,

    secretEnv: config.secretEnv, // Used for conditional rendering of payment copy

    goGovBaseUrl: goGovConfig.goGovBaseUrl, // Used for GoGov integration

    // Used for admin feedback in frontend
    adminFeedbackFieldThreshold: config.adminFeedbackFieldThreshold,
    adminFeedbackDisplayFrequency: config.adminFeedbackDisplayFrequency,

    growthbookClientKey: growthbookConfig.growthbookClientKey,
  }
}
