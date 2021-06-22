import FeatureManager from './util/FeatureManager.class'
import spcpMyInfo from './spcp-myinfo.config'

export * from './types'

const featureManager = new FeatureManager()

// Register features and associated middleware/fallbacks
featureManager.register(spcpMyInfo)

export default featureManager
