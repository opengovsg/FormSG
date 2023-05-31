import { Tags } from 'hot-shots'
import { ResponseMetadata } from 'shared/types'

import { statsdClient } from '../../config/datadog-statsd-client'

import { getNormalisedResponseTime } from './submission.utils'

export const submissionsStatsdClient = statsdClient.childClient({
  prefix: 'formsg.submissions.',
})

export const reportSubmissionResponseTime = (
  responseMetadata: ResponseMetadata,
  tags: Tags,
) => {
  // response Time
  submissionsStatsdClient.distribution(
    'responseTime',
    responseMetadata.responseTimeMs,
    1,
    tags,
  )

  // normalised response Time
  submissionsStatsdClient.distribution(
    'normResponseTime',
    getNormalisedResponseTime(
      responseMetadata.responseTimeMs,
      responseMetadata.numVisibleFields,
    ),
    1,
    tags,
  )
}
