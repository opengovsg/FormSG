import aws from 'aws-sdk'
import https from 'https'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { Consumer } from 'sqs-consumer'

import { SubmissionWebhookInfo } from '../../../types'
import config from '../../config/config'
import { createLoggerWithLabel, CustomLoggerParams } from '../../config/logger'
import { getEncryptSubmissionModel } from '../../models/submission.server.model'
import { transformMongoError } from '../../utils/handle-mongo-error'
import { PossibleDatabaseError } from '../core/core.errors'
import { SubmissionNotFoundError } from '../submission/submission.errors'

import {
  WebhookNoMoreRetriesError,
  WebhookRetriesNotEnabledError,
} from './webhook.errors'
import { WebhookQueueMessage } from './webhook.message'
import { WebhookProducer } from './webhook.producer'
import * as WebhookService from './webhook.service'
import { isSuccessfulResponse } from './webhook.utils'

const logger = createLoggerWithLabel(module)
const EncryptSubmission = getEncryptSubmissionModel(mongoose)

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
    // By default, the default Node.js HTTP/HTTPS SQS agent
    // creates a new TCP connection for every new request.
    // In production, pass an SQS instance to avoid the cost
    // of establishing new connections.
    sqs: config.isDevOrTest
      ? undefined
      : new aws.SQS({
          region: config.aws.region,
          httpOptions: {
            agent: new https.Agent({
              keepAlive: true,
            }),
          },
        }),
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
  async (sqsMessage: aws.SQS.Message): Promise<void> => {
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
      return Promise.resolve()
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
      return WebhookService.sendWebhook(
        webhookInfo.webhookView,
        webhookUrl,
      ).andThen((webhookResponse) => {
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

    if (retryResult.isOk()) return Promise.resolve()
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
      return Promise.resolve()
    }
    // Special handling for retries not enabled - this should not be moved
    // to DLQ as admin has disabled webhooks and/or webhook retries on purpose
    if (retryResult.error instanceof WebhookRetriesNotEnabledError) {
      logger.warn({
        message: 'Webhook retries no longer enabled on form',
        meta: logMeta,
      })
      return Promise.resolve()
    }
    // Remaining cases are unexpected errors, move to DLQ
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
    EncryptSubmission.retrieveWebhookInfoById(submissionId),
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
