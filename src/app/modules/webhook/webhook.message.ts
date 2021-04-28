import { Result } from 'neverthrow'

import { createLoggerWithLabel } from '../../config/logger'

import { QUEUE_MESSAGE_VERSION } from './webhook.constants'
import {
  WebhookNoMoreRetriesError,
  WebhookQueueMessageParsingError,
} from './webhook.errors'
import {
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
    return this.message.nextAttempt < Date.now()
  }

  incrementAttempts(): Result<WebhookQueueMessage, WebhookNoMoreRetriesError> {
    return getNextAttempt(this.message.previousAttempts).map(
      (nextAttempt) =>
        new WebhookQueueMessage({
          submissionId: this.message.submissionId,
          previousAttempts: [...this.message.previousAttempts, Date.now()],
          nextAttempt,
          _v: QUEUE_MESSAGE_VERSION,
        }),
    )
  }

  get submissionId(): string {
    return this.message.submissionId
  }

  get nextAttempt(): number {
    return this.message.nextAttempt
  }
}
