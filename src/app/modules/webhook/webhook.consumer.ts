import aws from 'aws-sdk'
import https from 'https'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { Consumer } from 'sqs-consumer'

import { SubmissionWebhookInfo } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import { getEncryptSubmissionModel } from '../../models/submission.server.model'
import { transformMongoError } from '../../utils/handle-mongo-error'
import { PossibleDatabaseError } from '../core/core.errors'
import { SubmissionNotFoundError } from '../submission/submission.errors'

import {
  WebhookMissingUrlError,
  WebhookNoMoreRetriesError,
} from './webhook.errors'
import { WebhookQueueMessage } from './webhook.message'
import { WebhookProducer } from './webhook.producer'
import * as WebhookService from './webhook.service'
import { isSuccessfulResponse } from './webhook.utils'

const logger = createLoggerWithLabel(module)
const EncryptSubmission = getEncryptSubmissionModel(mongoose)

export const startWebhookConsumer = (
  queueUrl: string,
  producer: WebhookProducer,
): void => {
  const app = Consumer.create({
    queueUrl,
    handleMessage: createWebhookQueueHandler(producer),
    sqs: new aws.SQS({
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

const createWebhookQueueHandler = (producer: WebhookProducer) => async (
  sqsMessage: aws.SQS.Message,
): Promise<void> => {
  logger.info({
    message: 'Consumed message from webhook queue',
    meta: {
      action: 'createWebhookQueueHandler',
    },
  })
  const { Body } = sqsMessage
  if (!Body) {
    logger.error({
      message: 'Webhook queue message contained undefined body',
      meta: {
        action: 'createWebhookQueueHandler',
        sqsMessage,
      },
    })
    // Resolve Promise so that malformed message is deleted from queue
    // and not consumed repeatedly
    return Promise.resolve()
  }

  // Parse message
  const webhookMessageResult = WebhookQueueMessage.deserialise(Body)
  if (webhookMessageResult.isErr()) {
    logger.error({
      message: 'Webhook queue message could not be parsed',
      meta: {
        action: 'createWebhookQueueHandler',
        webhookMessageResult,
      },
      error: webhookMessageResult.error,
    })
    // Resolve Promise so that malformed message is deleted from queue
    // and not consumed repeatedly
    return Promise.resolve()
  }
  const webhookMessage = webhookMessageResult.value

  // If not due, requeue
  if (!webhookMessage.isDue()) {
    logger.info({
      message: 'Webhook not due yet, requeueing',
      meta: {
        action: 'createWebhookQueueHandler',
      },
    })
    const requeueResult = await producer.sendMessage(webhookMessage)
    if (requeueResult.isErr()) {
      logger.error({
        message: 'Webhook queue message could not be requeued',
        meta: {
          action: 'createWebhookQueueHandler',
          webhookMessage,
        },
        error: requeueResult.error,
      })
      // Reject so requeue can be re-attempted
      return Promise.reject()
    }
    return Promise.resolve()
  }

  // If due, send webhook
  // First, retrieve webhook view and URL from database
  const retryResult = await retrieveWebhookInfo(
    webhookMessage.submissionId,
  ).andThen((webhookInfo) => {
    const { webhookUrl } = webhookInfo
    // Webhook URL was deleted
    if (!webhookUrl) return errAsync(new WebhookMissingUrlError())

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

  if (retryResult.isErr()) {
    // If max retries exceeded, allow message to be deleted from queue
    if (retryResult.error instanceof WebhookNoMoreRetriesError) {
      logger.warn({
        message: 'Maximum retries exceeded for webhook',
        meta: {
          action: 'createWebhookQueueHandler',
          webhookMessage,
        },
      })
      return Promise.resolve()
    }
    logger.error({
      message: 'Error while attempting to retry webhook',
      meta: {
        action: 'createWebhookQueueHandler',
        webhookMessage,
      },
      error: retryResult.error,
    })
    // Reject so retry can be reattempted
    return Promise.reject()
  }
  return Promise.resolve()
}

const retrieveWebhookInfo = (
  submissionId: string,
): ResultAsync<
  SubmissionWebhookInfo,
  SubmissionNotFoundError | PossibleDatabaseError
> =>
  ResultAsync.fromPromise(
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
