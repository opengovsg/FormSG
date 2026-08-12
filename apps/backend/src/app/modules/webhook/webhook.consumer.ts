import { Message } from '@aws-sdk/client-sqs'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { Consumer } from 'sqs-consumer'

import { SubmissionWebhookInfo, WebhookView } from '../../../types'
import config from '../../config/config'
import { createLoggerWithLabel, CustomLoggerParams } from '../../config/logger'
import getSubmissionModel from '../../models/submission.server.model'
import { transformMongoError } from '../../utils/handle-mongo-error'
import { PossibleDatabaseError } from '../core/core.errors'
import { SubmissionNotFoundError } from '../submission/submission.errors'
import {
  SnapshotDataIntegrityError,
  SnapshotFormatNotRecordedError,
} from '../submission/multirespondent-submission/webhook/submission-snapshot.errors'
import {
  resolveSnapshotRetryView,
  SnapshotRetryError,
} from '../submission/multirespondent-submission/webhook/webhook-retry-view'

import {
  WebhookNoMoreRetriesError,
  WebhookRetriesNotEnabledError,
} from './webhook.errors'
import { WebhookQueueMessage } from './webhook.message'
import { WebhookProducer } from './webhook.producer'
import * as WebhookService from './webhook.service'
import { webhookStatsdClient } from './webhook.statsd-client'
import { isSuccessfulResponse } from './webhook.utils'

const logger = createLoggerWithLabel(module)
const Submission = getSubmissionModel(mongoose)

/**
 * Starts polling a queue for webhook messages.
 * @param queueUrl URL of queue from which to consume messages
 * @param producer Producer which can be used to enqueue messages
 */
export const startWebhookConsumer = (
  queueUrl: string,
  producer: WebhookProducer,
): void => {
  const app = Consumer.create({
    queueUrl,
    region: config.aws.region,
    handleMessage: createWebhookQueueHandler(producer),
  })

  app.on('error', (error, message) => {
    logger.error({
      message:
        'Webhook consumer encountered error while interacting with queue',
      meta: {
        action: 'startWebhookConsumer',
        message,
      },
      error,
    })
  })

  app.start()

  logger.info({
    message: 'Webhook consumer started',
    meta: {
      action: 'startWebhookConsumer',
    },
  })
}

/**
 * Creates a handler to consume messages from webhook queue.
 * This handler does the following:
 * 1) Parses the message
 * 2) If the webhook is not due, requeues the message
 * 3) If the webhook is due, attempts the webhook
 * 4) Records the webhook attempt in the database
 * 5) If the webhook failed again, requeues the message
 *
 * Exported for testing.
 * @param producer Producer which can write messages to queue
 * @returns Handler for consumption of queue messages
 */
export const createWebhookQueueHandler =
  (producer: WebhookProducer) =>
  async (sqsMessage: Message): Promise<Message | undefined> => {
    const { Body, MessageId } = sqsMessage
    let logMeta: CustomLoggerParams['meta'] = {
      action: 'createWebhookQueueHandler',
      MessageId,
    }
    logger.info({
      message: 'Consumed message from webhook queue',
      meta: logMeta,
    })
    if (!Body) {
      logger.error({
        message: 'Webhook queue message contained undefined body',
        meta: logMeta,
      })
      // Malformed message will be retried until redrive policy is exceeded,
      // upon which it will be moved to dead-letter queue
      return Promise.reject()
    }

    // Parse message
    const webhookMessageResult = WebhookQueueMessage.deserialise(Body)
    if (webhookMessageResult.isErr()) {
      logger.error({
        message: 'Webhook queue message could not be parsed',
        meta: logMeta,
        error: webhookMessageResult.error,
      })
      return Promise.reject()
    }
    const webhookMessage = webhookMessageResult.value
    logMeta = {
      ...logMeta,
      webhookMessage: webhookMessage.prettify(),
    }

    // If not due, requeue
    if (!webhookMessage.isDue()) {
      logger.info({
        message: 'Webhook not due yet, requeueing',
        meta: logMeta,
      })
      const requeueResult = await producer.sendMessage(webhookMessage)
      if (requeueResult.isErr()) {
        logger.error({
          message: 'Webhook queue message could not be requeued',
          meta: logMeta,
          error: requeueResult.error,
        })
        // Reject so message is moved to DLQ
        return Promise.reject()
      }
      // Delete existing message from queue
      return sqsMessage
    }

    // If due, send webhook
    // First, retrieve webhook view and URL from database
    const retryResult = await retrieveWebhookInfo(
      webhookMessage.submissionId,
    ).andThen((webhookInfo) => {
      const { webhookUrl, isRetryEnabled } = webhookInfo
      logMeta = {
        ...logMeta,
        formId: webhookInfo.webhookView.data.formId,
      }
      // Webhook URL was deleted or retries disabled
      if (!webhookUrl || !isRetryEnabled)
        return errAsync(
          new WebhookRetriesNotEnabledError(webhookUrl, isRetryEnabled),
        )

      // Attempt webhook
      return resolveWebhookView(webhookMessage, webhookInfo)
        .andThen((webhookView) =>
          WebhookService.sendWebhook(webhookView, webhookUrl),
        )
        .andThen((webhookResponse) => {
          // Save webhook response to database, but carry on even if it fails
          void WebhookService.saveWebhookRecord(
            webhookMessage.submissionId,
            webhookResponse,
          )

          // Webhook was successful, no further action required
          if (isSuccessfulResponse(webhookResponse)) return okAsync(true)

          // Requeue webhook for subsequent retry
          return webhookMessage
            .incrementAttempts()
            .asyncAndThen((newMessage) => producer.sendMessage(newMessage))
        })
    })

    if (retryResult.isOk()) return sqsMessage
    // Error cases
    // Special handling for max retries exceeded - log a separate message
    // and resolve Promise so that message is removed from queue
    if (retryResult.error instanceof WebhookNoMoreRetriesError) {
      logger.error({
        message: 'Maximum retries exceeded for webhook',
        meta: {
          ...logMeta,
          webhookMessage: webhookMessage.getRetriesFailedState(),
        },
      })
      return sqsMessage
    }
    // Special handling for retries not enabled - this should not be moved
    // to DLQ as admin has disabled webhooks and/or webhook retries on purpose
    if (retryResult.error instanceof WebhookRetriesNotEnabledError) {
      logger.warn({
        message: 'Webhook retries no longer enabled on form',
        meta: logMeta,
      })
      return sqsMessage
    }
    // Special handling for a snapshot that cannot be replayed. Retrying never
    // fixes either case, so the message is deleted rather than left to churn
    // through redelivery into the DLQ. The stable error code is what alarms.
    if (
      retryResult.error instanceof SnapshotDataIntegrityError ||
      retryResult.error instanceof SnapshotFormatNotRecordedError
    ) {
      logger.error({
        message: 'Webhook retry could not replay the recorded step submission',
        meta: logMeta,
        error: retryResult.error,
      })
      webhookStatsdClient.increment('retry.replay_aborted', 1, 1, {
        errorCode: `${retryResult.error.code}`,
      })
      return sqsMessage
    }
    // Remaining cases are unexpected errors, move to DLQ. A transient or denied
    // snapshot read lands here: both happen before any HTTP call, so no webhook
    // attempt is burned and the retry schedule is preserved.
    logger.error({
      message: 'Error while attempting to retry webhook',
      meta: logMeta,
      error: retryResult.error,
    })
    // Reject so retry can be moved to dead-letter queue
    // if redrive policy is exceeded
    return Promise.reject()
  }

/**
 * Decides what an attempt delivers, from the message alone.
 *
 * A message naming a step submission is replayed from that step's frozen
 * snapshot, in the wire shape the message recorded — the payload policy is
 * deliberately NOT consulted here, so nothing that happened to the row or the
 * form since the initial send can change what this attempt delivers.
 *
 * A legacy message names no step submission, so it keeps the pre-snapshot
 * behaviour of shipping the live row.
 */
const resolveWebhookView = (
  webhookMessage: WebhookQueueMessage,
  webhookInfo: SubmissionWebhookInfo,
): ResultAsync<WebhookView, SnapshotRetryError> => {
  const { submissionIndex, contentFormat } = webhookMessage
  if (submissionIndex === undefined || contentFormat === undefined) {
    return okAsync(webhookInfo.webhookView)
  }

  return resolveSnapshotRetryView({
    liveView: webhookInfo.webhookView,
    submissionId: webhookMessage.submissionId,
    submissionIndex,
    contentFormat,
    snapshotTokens: webhookInfo.snapshotTokens,
  })
}

/**
 * Retrieves all relevant information to send webhook for a given submission.
 * @param submissionId
 * @returns ok(webhook information) if database retrieval succeeds
 * @returns err if submission ID does not exist or database retrieval errors
 */
const retrieveWebhookInfo = (
  submissionId: string,
): ResultAsync<
  SubmissionWebhookInfo,
  SubmissionNotFoundError | PossibleDatabaseError
> => {
  return ResultAsync.fromPromise(
    Submission.retrieveWebhookInfoById(submissionId),
    (error) => {
      logger.error({
        message: 'Error while retrieving webhook info for submission',
        meta: {
          action: 'retrieveWebhookInfo',
          submissionId,
        },
        error,
      })
      return transformMongoError(error)
    },
  ).andThen((submissionInfo) => {
    if (!submissionInfo) return errAsync(new SubmissionNotFoundError())
    return okAsync(submissionInfo)
  })
}
