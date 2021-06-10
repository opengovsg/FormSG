import FeatureManager from './util/FeatureManager.class'
import captcha from './captcha.config'
import googleAnalytics from './google-analytics.config'
import sentry from './sentry.config'
import sms from './sms.config'
import spcpMyInfo from './spcp-myinfo.config'
import verifiedFields from './verified-fields.config'
import webhookVerifiedContent from './webhook-verified-content.config'

export * from './types'

const featureManager = new FeatureManager()

// Register features and associated middleware/fallbacks
featureManager.register(captcha)
featureManager.register(sentry)
featureManager.register(googleAnalytics)
featureManager.register(spcpMyInfo)
featureManager.register(webhookVerifiedContent)
featureManager.register(sms)
featureManager.register(verifiedFields)

export default featureManager
