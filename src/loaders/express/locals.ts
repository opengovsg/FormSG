import ejs from 'ejs'
import { get } from 'lodash'

import config from '../../config/config'
import featureManager, { FeatureNames } from '../../config/feature-manager'

// Construct js with environment variables needed by frontend
const frontendVars = {
  isGeneralMaintenance: config.isGeneralMaintenance,
  isLoginBanner: config.isLoginBanner,
  siteBannerContent: config.siteBannerContent,
  adminBannerContent: config.adminBannerContent,
  logoBucketUrl: config.aws.logoBucketUrl, // S3 bucket
  formsgSdkMode: config.formsgSdkMode,
  captchaPublicKey: get(
    featureManager.props(FeatureNames.Captcha),
    'captchaPublicKey',
    null,
  ), // Recaptcha
  sentryConfigUrl: get(
    featureManager.props(FeatureNames.Sentry),
    'sentryConfigUrl',
    null,
  ), // Sentry.IO
  isSPMaintenance: get(
    featureManager.props(FeatureNames.SpcpMyInfo),
    'isSPMaintenance',
    null,
  ), // Singpass maintenance message
  isCPMaintenance: get(
    featureManager.props(FeatureNames.SpcpMyInfo),
    'isCPMaintenance',
    null,
  ), // Corppass maintenance message
  GATrackingID: get(
    featureManager.props(FeatureNames.GoogleAnalytics),
    'GATrackingID',
    null,
  ),
  spcpCookieDomain: get(
    featureManager.props(FeatureNames.SpcpMyInfo),
    'spcpCookieDomain',
    null,
  ), // Cookie domain used for removing spcp cookies
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
