import config from '../../config/config'

import { RetryInterval } from './webhook.types'

/**
 * Current version of queue message format.
 */
export const QUEUE_MESSAGE_VERSION = 0

// Conversion to seconds
const hours = (h: number) => h * 60 * 60
const minutes = (m: number) => m * 60

/**
 * Encodes retry policy.
 * Element 0 is time to wait + jitter before
 * retrying the first time, element 1 is time to wait
 * to wait + jitter before 2nd time, etc.
 * All units are in seconds.
 *
 * @example [{ base: 10, jitter: 5}, { base: 20, jitter: 5 }] means
 * the first retry is attempted between 10 - 5 = 5 seconds and
 * 10 + 5 = 15 seconds after the submission. If the first retry fails,
 * then the second retry is attempted between 15 and 25 seconds after
 * the submission.
 */
export const RETRY_INTERVALS: RetryInterval[] = config.isDevOrTest
  ? [
      { base: 10, jitter: 5 },
      { base: 20, jitter: 5 },
      { base: 30, jitter: 5 },
    ]
  : [
      { base: minutes(5), jitter: minutes(1) },
      { base: hours(1), jitter: minutes(15) },
      { base: hours(2), jitter: minutes(30) },
      { base: hours(4), jitter: hours(1) },
      { base: hours(8), jitter: hours(2) },
      { base: hours(20), jitter: hours(4) },
    ]

/**
 * Max possible delay for a message, as specified by AWS.
 */
export const MAX_DELAY_SECONDS = minutes(15)

/**
 * Tolerance allowed for determining if a message is due to be sent.
 * If a message's next attempt is scheduled either in the past or this
 * number of seconds in the future, it will be sent.
 */
export const DUE_TIME_TOLERANCE_SECONDS = minutes(1)

/**
 * WEBHOOK_MAX_CONTENT_LENGTH defined the max size of the http response content in bytes
 * allowed by the webhook call. Given that the response of the webhook call is not used and does not
 * impact our partner's processing of the call, we set this to 1MB, which should accommodate webhook responses.
 *
 */
export const WEBHOOK_MAX_CONTENT_LENGTH = 1000000
