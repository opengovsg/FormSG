import { statsdClient } from '../../config/datadog-statsd-client'

export const submissionsStatsdClient = statsdClient.childClient({
  prefix: 'formsg.submissions.',
})
