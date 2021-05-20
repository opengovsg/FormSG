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
 */
export const RETRY_INTERVALS: RetryInterval[] = config.isDev
  ? [
      { base: 10, jitter: 5 },
      { base: 20, jitter: 5 },
      { base: 30, jitter: 5 },
    ]
  : [
      { base: minutes(5), jitter: minutes(1) },
      { base: hours(1), jitter: minutes(30) },
      { base: hours(2), jitter: minutes(30) },
      { base: hours(4), jitter: minutes(30) },
      { base: hours(8), jitter: minutes(30) },
      { base: hours(24), jitter: minutes(30) },
    ]

/**
 * Tolerance allowed for determining if a message is due to be sent.
 * If a message's next attempt is due within this number of seconds
 * from the current time, it will be sent.
 */
export const DUE_TIME_TOLERANCE_SECONDS = minutes(1)
