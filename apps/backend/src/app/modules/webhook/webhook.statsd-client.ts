import { statsdClient } from '../../config/datadog-statsd-client'

export const webhookStatsdClient = statsdClient.childClient({
  prefix: 'formsg.webhooks.',
})
