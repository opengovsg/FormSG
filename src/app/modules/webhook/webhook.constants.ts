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
export const RETRY_INTERVALS: RetryInterval[] = [
  { base: minutes(5), jitter: minutes(1) },
  { base: hours(1), jitter: minutes(30) },
  { base: hours(2), jitter: minutes(30) },
  { base: hours(4), jitter: minutes(30) },
  { base: hours(8), jitter: minutes(30) },
  { base: hours(24), jitter: minutes(30) },
]

/**
 * Max possible delay for a message, as specified by AWS.
 */
export const MAX_DELAY_SECONDS = minutes(15)
