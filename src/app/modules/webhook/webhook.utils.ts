import { AxiosResponse } from 'axios'
import { inRange } from 'lodash'
import moment from 'moment-timezone'
import { err, ok, Result } from 'neverthrow'

import { stringifySafe } from '../../../shared/util/stringify-safe'
import { IWebhookResponse } from '../../../types'
import { TIMEZONE } from '../../constants/timezone'
import { randomUniformInt } from '../../utils/random-uniform'

import { MAX_DELAY_SECONDS, RETRY_INTERVALS } from './webhook.constants'
import { WebhookNoMoreRetriesError } from './webhook.errors'

/**
 * Formats a response object for update in the Submissions collection
 * @param {response} response Response object returned by axios
 */
export const formatWebhookResponse = (
  response?: AxiosResponse<unknown>,
): IWebhookResponse['response'] => ({
  status: response?.status ?? 0,
  headers: stringifySafe(response?.headers) ?? '',
  data: stringifySafe(response?.data) ?? '',
})

/**
 * Computes epoch of next webhook attempt based on previous attempts.
 * @param previousAttempts Array of epochs of previous attempts
 * @returns ok(epoch of next attempt) if there are valid retries remaining
 * @returns err(WebhookNoMoreRetriesError) if there are no more retries remaining
 */
export const getNextAttempt = (
  previousAttempts: number[],
): Result<number, WebhookNoMoreRetriesError> => {
  // Total allowed number of attempts is RETRY_INTERVALS + 1.
  // The +1 accounts for the initial webhook attempt immediately
  // after form submission.
  if (previousAttempts.length >= RETRY_INTERVALS.length + 1) {
    return err(new WebhookNoMoreRetriesError())
  }
  // The -1 accounts for the initial webhook attempt, e.g. if
  // the length of previousAttempts is 1, then we should get
  // the interval for the first retry at RETRY_INTERVALS[0]
  const interval = RETRY_INTERVALS[previousAttempts.length - 1]
  const nextAttemptWaitTimeSeconds = randomUniformInt(
    interval.base - interval.jitter,
    interval.base + interval.jitter,
  )
  // Calculate next attempt based on time from initial attempt, or
  // current date if initial attempt does not exist
  const initialAttempt = previousAttempts[0] ?? Date.now()
  return ok(initialAttempt + nextAttemptWaitTimeSeconds * 1000)
}

/**
 * Encodes success condition of webhook. Webhooks are considered
 * successful if the status code >= 200 and < 300.
 * @param webhookResponse Response from receiving server
 * @returns true if webhook was successful
 */
export const isSuccessfulResponse = (
  webhookResponse: IWebhookResponse,
): boolean => inRange(webhookResponse.response.status, 200, 300)

/**
 * Calculates the number of seconds to delay a message sent to
 * the webhook queue. This is the minimum of (time to next attempt,
 * max possible delay timeout).
 * @param nextAttempt Epoch of next attempt
 */
export const calculateDelaySeconds = (nextAttempt: number): number => {
  const secondsToNextAttempt = Math.max(0, (nextAttempt - Date.now()) / 1000)
  return Math.min(secondsToNextAttempt, MAX_DELAY_SECONDS)
}

/**
 * Converts an epoch to a readable format.
 * @param epoch
 * @returns the epoch represented as a readable string
 */
export const prettifyEpoch = (epoch: number): string =>
  moment(epoch).tz(TIMEZONE).format('D MMM YYYY, h:mm:ssa z')
