import axios from 'axios'
import Bluebird from 'bluebird'
import { WebhookResponse } from 'formsg-shared/types'
import { get } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import {
  IEncryptedSubmissionSchema,
  IMultirespondentSubmissionSchema,
  ISubmissionSchema,
  WebhookView,
} from '../../../types'
import { aws as AwsConfig } from '../../config/config'
import formsgSdk from '../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../config/logger'
import getSubmissionModel from '../../models/submission.server.model'
import { getSignedS3Url } from '../../utils/aws-s3'
import { transformMongoError } from '../../utils/handle-mongo-error'
import { DatabaseError, PossibleDatabaseError } from '../core/core.errors'
import type {
  WebhookConsumerType,
  WebhookContentFormat,
} from '../submission/multirespondent-submission/webhook/webhook-payload-policy'
import { SubmissionNotFoundError } from '../submission/submission.errors'

import { WEBHOOK_MAX_CONTENT_LENGTH } from './webhook.constants'
import {
  WebhookFailedWithAxiosError,
  WebhookFailedWithPresignedUrlGenerationError,
  WebhookFailedWithUnknownError,
  WebhookPushToQueueError,
  WebhookValidationError,
} from './webhook.errors'
import { WebhookQueueMessage } from './webhook.message'
import { WebhookProducer } from './webhook.producer'
import { webhookStatsdClient } from './webhook.statsd-client'
import { SnapshotRef } from './webhook.types'
import { formatWebhookResponse, isSuccessfulResponse } from './webhook.utils'
import { validateWebhookUrl } from './webhook.validation'

const logger = createLoggerWithLabel(module)
const Submission = getSubmissionModel(mongoose)

/**
 * Updates the submission in the database with the webhook response
 * @param {ObjectId} formId Form that submission to update belongs to
 * @param {ObjectId} submissionId Submission to update with webhook response
 * @param {Object} updateObj Webhook response to update submission document with
 * @param {number} updateObj.status status code received from webhook endpoint
 * @param {string} updateObj.statusText status text received from webhook endpoint
 * @param {string} updateObj.headers stringified headers received from webhook endpoint
 * @param {string} updateObj.data stringified data received from webhook endpoint
 */
export const saveWebhookRecord = (
  submissionId: ISubmissionSchema['_id'],
  record: WebhookResponse,
): ResultAsync<
  ISubmissionSchema,
  PossibleDatabaseError | SubmissionNotFoundError
> => {
  return ResultAsync.fromPromise(
    Submission.addWebhookResponse(submissionId, record),
    (error) => {
      logger.error({
        message: 'Database update for webhook status failed',
        meta: {
          action: 'saveWebhookRecord',
          submissionId,
          record,
        },
        error,
      })
      return transformMongoError(error)
    },
  ).andThen((updatedSubmission) => {
    if (!updatedSubmission)
      return errAsync(
        new SubmissionNotFoundError(
          'Unable to find submission ID to update webhook response',
        ),
      )
    return okAsync(updatedSubmission)
  })
}

/**
 * The attachment objects a delivery presigns live in the bucket its own wire
 * shape writes to: V1 copies are encrypted to the form key and kept apart
 * from the native objects, which are encrypted to the submission key.
 * An absent content format is a delivery that never wrote V1 copies —
 * storage mode, email mode and the legacy MRF routes — so it reads native.
 */
const attachmentBucketForContentFormat = (
  contentFormat?: WebhookContentFormat,
): string =>
  contentFormat === 'v1'
    ? AwsConfig.submissionHistoryV1AttachmentS3Bucket
    : AwsConfig.attachmentS3Bucket

const createWebhookSubmissionView = (
  submissionWebhookView: WebhookView,
  contentFormat?: WebhookContentFormat,
): Promise<WebhookView> => {
  // Generate S3 signed urls
  const signedUrlPromises: Record<string, Promise<string>> = {}
  for (const key in submissionWebhookView.data.attachmentDownloadUrls) {
    signedUrlPromises[key] = getSignedS3Url(
      {
        Bucket: attachmentBucketForContentFormat(contentFormat),
        Key: submissionWebhookView.data.attachmentDownloadUrls[key],
      },
      60 * 60, // one hour expiry
    )
  }

  return Bluebird.props(signedUrlPromises).then((signedUrls) => {
    submissionWebhookView.data.attachmentDownloadUrls = signedUrls
    return submissionWebhookView
  })
}

export const sendWebhook = (
  webhookView: WebhookView,
  webhookUrl: string,
  contentFormat?: WebhookContentFormat,
): ResultAsync<
  WebhookResponse,
  | WebhookValidationError
  | WebhookFailedWithAxiosError
  | WebhookFailedWithPresignedUrlGenerationError
  | WebhookFailedWithUnknownError
> => {
  const now = Date.now()
  const { submissionId, formId } = webhookView.data

  const signature = formsgSdk.webhooks.generateSignature({
    uri: webhookUrl,
    submissionId,
    formId,
    epoch: now,
  })

  const logMeta = {
    action: 'sendWebhook',
    submissionId,
    formId,
    now,
    webhookUrl,
    signature,
  }

  return ResultAsync.fromPromise(validateWebhookUrl(webhookUrl), (error) => {
    logger.error({
      message: 'Webhook URL failed validation',
      meta: logMeta,
      error,
    })
    return error instanceof WebhookValidationError
      ? error
      : new WebhookValidationError()
  }).andThen(() => {
    return ResultAsync.fromPromise(
      createWebhookSubmissionView(webhookView, contentFormat),
      (error) => {
        logger.error({
          message: 'S3 attachment presigned URL generation failed',
          meta: logMeta,
          error,
        })
        return new WebhookFailedWithPresignedUrlGenerationError(error)
      },
    )
      .andThen((submissionWebhookView) =>
        ResultAsync.fromPromise(
          axios.post<unknown>(webhookUrl, submissionWebhookView, {
            headers: {
              'X-FormSG-Signature': formsgSdk.webhooks.constructHeader({
                epoch: now,
                submissionId,
                formId,
                signature,
              }),
            },
            decompress: false,
            maxContentLength: WEBHOOK_MAX_CONTENT_LENGTH,
            maxRedirects: 0,
            // Timeout after 10 seconds to allow for cold starts in receiver,
            // e.g. Lambdas
            timeout: 10 * 1000,
          }),
          (error) => {
            logger.error({
              message: 'Webhook POST failed',
              meta: {
                ...logMeta,
                isAxiosError: axios.isAxiosError(error),
                status: get(error, 'response.status'),
              },
              error,
            })
            if (axios.isAxiosError(error)) {
              return new WebhookFailedWithAxiosError(error)
            }
            return new WebhookFailedWithUnknownError(error)
          },
        ),
      )
      .map((response) => {
        // Capture response for logging purposes
        logger.info({
          message: 'Webhook POST succeeded',
          meta: {
            ...logMeta,
            status: get(response, 'status'),
          },
        })
        return {
          signature,
          webhookUrl,
          response: formatWebhookResponse(response),
        }
      })
      .orElse((error) => {
        // Webhook was not posted
        if (error instanceof WebhookValidationError) return errAsync(error)

        // S3 pre-signed URL generation failed
        if (error instanceof WebhookFailedWithPresignedUrlGenerationError)
          return errAsync(error)

        // Webhook was posted but failed
        if (error instanceof WebhookFailedWithUnknownError) {
          return okAsync({
            signature,
            webhookUrl,
            // Not Axios error so no guarantee of having response.
            // Hence allow formatting function to return default shape.
            response: formatWebhookResponse(),
          })
        }

        const axiosError = error.meta.originalError
        return okAsync({
          signature,
          webhookUrl,
          response: formatWebhookResponse(axiosError.response),
        })
      })
  })
}

export type WebhookType = 'zapier' | 'plumber' | 'generic'

export const getWebhookType = (webhookUrl: string): WebhookType => {
  const isZapier = /^https:\/\/hooks\.zapier\.com\//
  const isPlumber = /^https:\/\/plumber\.gov\.sg\/webhooks\//
  const webhookType = isZapier.test(webhookUrl)
    ? 'zapier'
    : isPlumber.test(webhookUrl)
      ? 'plumber'
      : 'generic'
  return webhookType
}

/**
 * Narrows the URL family represented by WebhookType to
 * the consumer class the payload policy reasons about.
 */
export const toConsumerType = (
  webhookType: WebhookType,
): WebhookConsumerType => {
  switch (webhookType) {
    case 'plumber':
      return 'plumber'
    case 'zapier':
    case 'generic':
      return 'generic'
  }
}

/**
 * Creates a function which sends a webhook and saves the necessary records.
 * This function sends the INITIAL webhook, which occurs immediately after
 * a submission. If the initial webhook fails and retries are enabled, the
 * webhook is queued for retries.
 * @returns function which sends webhook and saves a record of it
 */
export const createInitialWebhookSender =
  (producer?: WebhookProducer) =>
  (
    submission: IEncryptedSubmissionSchema | IMultirespondentSubmissionSchema,
    webhookUrl: string,
    isRetryEnabled: boolean,
    webhookView?: WebhookView,
    snapshotRef?: SnapshotRef,
  ): ResultAsync<
    true,
    | WebhookValidationError
    | PossibleDatabaseError
    | SubmissionNotFoundError
    | WebhookPushToQueueError
  > => {
    // Attempt to send webhook

    // RATIONALE: When a pre-built view is supplied (e.g. an MRF
    // v4 snapshot-reconstructed payload) use it directly.
    // Otherwise, derive it from the live row via getWebhookView (legacy path).
    const webhookViewToUse = webhookView
      ? okAsync(webhookView)
      : ResultAsync.fromPromise(
          submission.getWebhookView(),
          () => new DatabaseError(),
        )

    // RATIONALE: A V1 delivery is only ever made from a V1 snapshot, so the
    // snapshot reference is the delivery's wire shape and tells the presigned
    // URL builder which attachment bucket to read.
    return webhookViewToUse.andThen((webhookView) =>
      sendWebhook(webhookView, webhookUrl, snapshotRef?.contentFormat).andThen(
        (webhookResponse) => {
          webhookStatsdClient.increment('sent', 1, 1, {
            responseCode: `${webhookResponse.response.status || null}`,
            webhookType: getWebhookType(webhookUrl),
            isRetryEnabled: `${isRetryEnabled}`,
          })

          // Save record of sending to database
          return saveWebhookRecord(submission._id, webhookResponse).andThen(
            () => {
              // If webhook successful or retries not enabled, no further action
              if (
                isSuccessfulResponse(webhookResponse) ||
                !producer ||
                !isRetryEnabled
              ) {
                return okAsync(true as const)
              }
              // Webhook failed and retries enabled, so create initial message and enqueue
              return WebhookQueueMessage.fromSubmissionId(
                String(submission._id),
                snapshotRef,
              ).asyncAndThen((queueMessage) =>
                producer.sendMessage(queueMessage),
              )
            },
          )
        },
      ),
    )
  }
