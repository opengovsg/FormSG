import ejs from 'ejs'

import config from '../../config/config'
import { captchaConfig } from '../../config/feature-manager/captcha.config'
import { googleAnalyticsConfig } from '../../config/feature-manager/google-analytics.config'
import { sentryConfig } from '../../config/feature-manager/sentry.config'
import { spcpMyInfoConfig } from '../../config/feature-manager/spcp-myinfo.config'

// Construct js with environment variables needed by frontend
const frontendVars = {
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
  GATrackingID: googleAnalyticsConfig.GATrackingID,
  spcpCookieDomain: spcpMyInfoConfig.spcpCookieDomain, // Cookie domain used for removing spcp cookies
}
const environment = ejs.render(
  `
    // Singpass/Corppass maintenance message
    var isSPMaintenance = "<%- isSPMaintenance %>"
    var isCPMaintenance = "<%- isCPMaintenance %>"
    var isGeneralMaintenance = "<%- isGeneralMaintenance %>"
    var isLoginBanner = "<%- isLoginBanner %>"
    var siteBannerContent = "<%- siteBannerContent %>"
    var adminBannerContent = "<%- adminBannerContent %>"
    // Google Analytics
    var GATrackingID = "<%= GATrackingID%>"
    // Recaptcha
    var captchaPublicKey = "<%= captchaPublicKey %>"
    // Sentry.IO
    var sentryConfigUrl = "<%= sentryConfigUrl%>"
    // S3 bucket
    var logoBucketUrl = "<%= logoBucketUrl%>"
    // Node env
    var formsgSdkMode = "<%= formsgSdkMode%>"
    // SPCP Cookie
    var spcpCookieDomain = "<%= spcpCookieDomain%>"
  `,
  frontendVars,
)

const appLocals = {
  ...frontendVars,
  ...config.app,
  appName: config.app.title,
  redirectPath: null,
  environment,
}

export default appLocals
