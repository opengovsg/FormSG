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

export class WebhookQueueMessage {
  message: WebhookQueueMessageObject

  constructor(message: WebhookQueueMessageObject) {
    this.message = message
  }

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

  serialise(): string {
    return JSON.stringify(this.message)
  }

  isDue(): boolean {
    // Allow tolerance for clock drift
    return (
      Math.abs(differenceInSeconds(Date.now(), this.message.nextAttempt)) <=
      DUE_TIME_TOLERANCE_SECONDS
    )
  }

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
