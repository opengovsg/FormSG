import FeatureManager from './util/FeatureManager.class'
import sms from './sms.config'
import spcpMyInfo from './spcp-myinfo.config'

export * from './types'

const featureManager = new FeatureManager()

// Register features and associated middleware/fallbacks
featureManager.register(spcpMyInfo)
featureManager.register(sms)

export default featureManager
