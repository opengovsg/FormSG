import { differenceInSeconds } from 'date-fns'
import { Result } from 'neverthrow'

import { createLoggerWithLabel } from '../../config/logger'

import {
  DUE_TIME_TOLERANCE_SECONDS,
  QUEUE_MESSAGE_VERSION,
  QUEUE_MESSAGE_VERSION_LEGACY,
} from './webhook.constants'
import {
  WebhookNoMoreRetriesError,
  WebhookQueueMessageParsingError,
} from './webhook.errors'
import {
  QueueMessageContentFormat,
  SnapshotRef,
  WebhookFailedQueueMessage,
  WebhookQueueMessage as webhookMessageSchema,
  WebhookQueueMessageObject,
  WebhookQueueMessagePrettified,
} from './webhook.types'
import { getNextAttempt, prettifyEpoch } from './webhook.utils'

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
   *
   * Assumes that initial webhook has just been attempted,
   * hence uses the current date as the time of the first
   * webhook attempt.
   * @param submissionId
   * @param snapshotRef the step submission a retry must reproduce, and the wire
   * shape it must reproduce it in. Supplied only when a snapshot was recorded
   * for that step; without it the retry falls back to the live submission row.
   * @returns ok(encapsulated message) if retry policy exists
   * @returns err if the retry policy does not allow any retries
   */
  static fromSubmissionId(
    submissionId: string,
    snapshotRef?: SnapshotRef,
  ): Result<WebhookQueueMessage, WebhookNoMoreRetriesError> {
    const initialAttempt = Date.now()
    return getNextAttempt(/* previousAttempts =*/ [initialAttempt]).map(
      (nextAttempt) =>
        new WebhookQueueMessage(
          snapshotRef
            ? {
                submissionId,
                previousAttempts: [initialAttempt],
                nextAttempt,
                _v: QUEUE_MESSAGE_VERSION,
                submissionIndex: snapshotRef.submissionIndex,
                contentFormat: snapshotRef.contentFormat,
              }
            : {
                submissionId,
                previousAttempts: [initialAttempt],
                nextAttempt,
                _v: QUEUE_MESSAGE_VERSION_LEGACY,
              },
        ),
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
      // Argument order is important. If nextAttempt is in the past,
      // differenceInSeconds will return a negative number.
      differenceInSeconds(this.message.nextAttempt, Date.now()) <=
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
      this.message.nextAttempt,
    ]
    return getNextAttempt(updatedPreviousAttempts).map(
      (nextAttempt) =>
        // RATIONALE: the message version and the step submission it names are
        // carried forward untouched. A subsequent attempt must deliver exactly
        // what this attempt would have.
        new WebhookQueueMessage({
          ...this.message,
          previousAttempts: updatedPreviousAttempts,
          nextAttempt,
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
      previousAttempts: [
        ...this.message.previousAttempts,
        this.nextAttempt,
      ].map(prettifyEpoch),
      _v: this.message._v,
      ...this.snapshotRefForLogs(),
    }
  }

  prettify(): WebhookQueueMessagePrettified {
    return {
      submissionId: this.submissionId,
      previousAttempts: this.message.previousAttempts.map(prettifyEpoch),
      nextAttempt: prettifyEpoch(this.nextAttempt),
      _v: this.message._v,
      ...this.snapshotRefForLogs(),
    }
  }

  private snapshotRefForLogs(): {
    submissionIndex?: number
    contentFormat?: QueueMessageContentFormat
  } {
    return this.message._v === QUEUE_MESSAGE_VERSION
      ? {
          submissionIndex: this.message.submissionIndex,
          contentFormat: this.message.contentFormat,
        }
      : {}
  }

  get submissionId(): string {
    return this.message.submissionId
  }

  get nextAttempt(): number {
    return this.message.nextAttempt
  }

  /**
   * The step submission this message must redeliver, or undefined for a legacy
   * message, which is redelivered from the live submission row instead.
   */
  get submissionIndex(): number | undefined {
    return this.message._v === QUEUE_MESSAGE_VERSION
      ? this.message.submissionIndex
      : undefined
  }

  /**
   * The wire shape this message must be delivered in, fixed at enqueue time.
   * Never re-derived from the form or a feature flag at send.
   */
  get contentFormat(): QueueMessageContentFormat | undefined {
    return this.message._v === QUEUE_MESSAGE_VERSION
      ? this.message.contentFormat
      : undefined
  }
}
