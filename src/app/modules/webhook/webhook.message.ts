import { differenceInSeconds } from 'date-fns'
import { Result } from 'neverthrow'

import { createLoggerWithLabel } from '../../config/logger'

import {
  DUE_TIME_TOLERANCE_SECONDS,
  QUEUE_MESSAGE_VERSION,
} from './webhook.constants'
import {
  WebhookNoMoreRetriesError,
  WebhookQueueMessageParsingError,
} from './webhook.errors'
import {
  WebhookFailedQueueMessage,
  webhookMessageSchema,
  WebhookQueueMessageObject,
} from './webhook.types'
import { getNextAttempt } from './webhook.utils'

const logger = createLoggerWithLabel(module)

/**
 * Encapsulates a queue message for webhook retries.
 */
export class WebhookQueueMessage {
  message: WebhookQueueMessageObject

  constructor(message: WebhookQueueMessageObject) {
    this.message = message
  }

  /**
   * Converts a webhook queue message body into an encapsulated
   * class instance.
   * @param body Raw body of webhook queue message
   * @returns ok(encapsulated message) if message can be parsed successfully
   * @returns err if message fails to be parsed
   */
  static deserialise(
    body: string,
  ): Result<WebhookQueueMessage, WebhookQueueMessageParsingError> {
    return Result.fromThrowable(
      () => JSON.parse(body) as unknown,
      (error) => {
        logger.error({
          message: 'Unable to parse webhook queue message body',
          meta: {
            action: 'deserialise',
            body,
          },
          error,
        })
        return new WebhookQueueMessageParsingError(error)
      },
    )()
      .andThen((parsed) =>
        Result.fromThrowable(
          () => webhookMessageSchema.parse(parsed),
          (error) => {
            logger.error({
              message: 'Webhook queue message body has wrong shape',
              meta: {
                action: 'deserialise',
                body,
              },
              error,
            })
            return new WebhookQueueMessageParsingError(error)
          },
        )(),
      )
      .map((validated) => new WebhookQueueMessage(validated))
  }

  /**
   * Initialises a webhook queue message which has not been
   * retried as yet. This function succeeds as long as
   * the retry policy allows for at least one retry.
   * @param submissionId
   * @returns ok(encapsulated message) if retry policy exists
   * @returns err if the retry policy does not allow any retries
   */
  static fromSubmissionId(
    submissionId: string,
  ): Result<WebhookQueueMessage, WebhookNoMoreRetriesError> {
    return getNextAttempt([]).map(
      (nextAttempt) =>
        new WebhookQueueMessage({
          submissionId,
          previousAttempts: [],
          nextAttempt,
          _v: QUEUE_MESSAGE_VERSION,
        }),
    )
  }

  /**
   * Serialises for enqueueing.
   * @returns Serialised message
   */
  serialise(): string {
    return JSON.stringify(this.message)
  }

  /**
   * Determines whether the message is currently due to be sent.
   * @returns true if webhook is currently due to be sent, false otherwise
   */
  isDue(): boolean {
    // Allow tolerance for clock drift
    return (
      Math.abs(differenceInSeconds(Date.now(), this.message.nextAttempt)) <=
      DUE_TIME_TOLERANCE_SECONDS
    )
  }

  /**
   * Updates the message as having just been retried, and adds a new time for the
   * next attempt.
   * This function should only be called on a message for which the webhook has just
   * been attempted and failed.
   * @returns ok(WebhookQueueMessage) if message can still be retried
   * @returns err(WebhookNoMoreRetriesError) if max retries have been exceeded
   */
  incrementAttempts(): Result<WebhookQueueMessage, WebhookNoMoreRetriesError> {
    const updatedPreviousAttempts = [
      ...this.message.previousAttempts,
      Date.now(),
    ]
    return getNextAttempt(updatedPreviousAttempts).map(
      (nextAttempt) =>
        new WebhookQueueMessage({
          submissionId: this.message.submissionId,
          previousAttempts: updatedPreviousAttempts,
          nextAttempt,
          _v: QUEUE_MESSAGE_VERSION,
        }),
    )
  }

  /**
   * Converts a message to reflect that all retries have failed.
   * @returns Message converted into a failure shape
   */
  getRetriesFailedState(): WebhookFailedQueueMessage {
    return {
      submissionId: this.submissionId,
      previousAttempts: [...this.message.previousAttempts, this.nextAttempt],
      _v: this.message._v,
    }
  }

  get submissionId(): string {
    return this.message.submissionId
  }

  get nextAttempt(): number {
    return this.message.nextAttempt
  }
}
