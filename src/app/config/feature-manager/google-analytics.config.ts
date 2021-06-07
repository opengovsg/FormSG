import { FeatureNames, RegisterableFeature } from './types'

const googleAnalyticsFeature: RegisterableFeature<FeatureNames.GoogleAnalytics> =
  {
    name: FeatureNames.GoogleAnalytics,
    schema: {
      GATrackingID: {
        doc: 'Google Analytics tracking ID',
        format: String,
        default: null,
        env: 'GA_TRACKING_ID',
      },
    },
  }

export default googleAnalyticsFeature
