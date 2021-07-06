import convict, { Schema } from 'convict'
import { url } from 'convict-format-with-validator'

export interface ISentry {
  sentryConfigUrl: string
  cspReportUri: string
}

convict.addFormat(url)

const sentryFeature: Schema<ISentry> = {
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
}

export const sentryConfig = convict(sentryFeature)
  .validate({ allowed: 'strict' })
  .getProperties()
