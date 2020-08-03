import ejs from 'ejs'

import config from '../../config/config'
import featureManager from '../../config/feature-manager'
import { FeatureNames } from '../../config/feature-manager/types'

// Construct js with environment variables needed by frontend
const frontendVars = {
  isGeneralMaintenance: config.isGeneralMaintenance,
  isLoginBanner: config.isLoginBanner,
  siteBannerContent: config.siteBannerContent,
  adminBannerContent: config.adminBannerContent,
  logoBucketUrl: config.aws.logoBucketUrl, // S3 bucket
  formsgSdkMode: config.formsgSdkMode,
  captchaPublicKey:
    featureManager.props(FeatureNames.Captcha).captchaPublicKey || '', // Recaptcha
  sentryConfigUrl:
    featureManager.props(FeatureNames.Sentry).sentryConfigUrl || '', // Sentry.IO
  isSPMaintenance:
    featureManager.props(FeatureNames.SpcpMyInfo).isSPMaintenance || '', // Singpass maintenance message
  isCPMaintenance:
    featureManager.props(FeatureNames.SpcpMyInfo).isCPMaintenance || '', // Corppass maintenance message
  GATrackingID:
    featureManager.props(FeatureNames.GoogleAnalytics).GATrackingID || '',
  spcpCookieDomain: featureManager.props(FeatureNames.SpcpMyInfo)
    .spcpCookieDomain, // Cookie domain used for removing spcp cookies
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
