import { statsdClient } from '../../config/datadog-statsd-client'

export const twilioStatsdClient = statsdClient.childClient({
  prefix: 'vendor.twilio.',
})
