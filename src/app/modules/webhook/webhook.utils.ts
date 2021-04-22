import { AxiosResponse } from 'axios'
import { err, ok, Result } from 'neverthrow'

import { stringifySafe } from '../../../shared/util/stringify-safe'
import { IWebhookResponse } from '../../../types'
import { randomUniform } from '../../utils/random-uniform'

import { RETRY_INTERVALS } from './webhook.constants'
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
  if (previousAttempts.length >= RETRY_INTERVALS.length)
    return err(new WebhookNoMoreRetriesError())
  const interval = RETRY_INTERVALS[previousAttempts.length]
  const nextAttemptWaitTimeSeconds = randomUniform(
    interval.base - interval.jitter,
    interval.base + interval.jitter,
  )
  return ok(Date.now() + nextAttemptWaitTimeSeconds * 1000)
}
