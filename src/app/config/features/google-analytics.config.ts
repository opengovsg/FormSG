// TODO: remove after React rollout #4786
import convict, { Schema } from 'convict'

export interface IGoogleAnalytics {
  GATrackingID: string | null
}

const googleAnalyticsSchema: Schema<IGoogleAnalytics> = {
  GATrackingID: {
    doc: 'Google Analytics tracking ID',
    format: String,
    default: null,
    env: 'GA_TRACKING_ID',
  },
}

export const googleAnalyticsConfig = convict(googleAnalyticsSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
