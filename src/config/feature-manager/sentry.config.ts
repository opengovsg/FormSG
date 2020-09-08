import { FeatureNames, RegisterableFeature } from './types'

const sentryFeature: RegisterableFeature<FeatureNames.Sentry> = {
  name: FeatureNames.Sentry,
  schema: {
    sentryConfigUrl: {
      doc: 'Sentry.io URL for configuring the Sentry SDK',
      format: 'url',
      default: null,
      env: 'SENTRY_CONFIG_URL',
    },
    cspReportUri: {
      doc: 'Endpoint for content security policy reporting',
      format: 'url',
      default: null,
      env: 'CSP_REPORT_URI',
    },
  },
}

export default sentryFeature
