import axios from 'axios'
import Bluebird from 'bluebird'
import { WebhookResponse } from 'formsg-shared/types'
import { cloneDeep, get } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import {
  IEncryptedSubmissionSchema,
  IMultirespondentSubmissionSchema,
  ISubmissionSchema,
  RecordWebhookAttemptParams,
  WebhookAttemptStoreMode,
  WebhookView,
} from '../../../types'
import { aws as AwsConfig } from '../../config/config'
import { webhooksAndVerifiedContentConfig } from '../../config/features/webhook-verified-content.config'
import formsgSdk from '../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../config/logger'
import getSubmissionModel from '../../models/submission.server.model'
import getWebhookAttemptModel from '../../models/webhook_attempt.server.model'
import { transformMongoError } from '../../utils/handle-mongo-error'
import { DatabaseError, PossibleDatabaseError } from '../core/core.errors'
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
import { formatWebhookResponse, isSuccessfulResponse } from './webhook.utils'
import { validateWebhookUrl } from './webhook.validation'

const logger = createLoggerWithLabel(module)
const Submission = getSubmissionModel(mongoose)
const WebhookAttempt = getWebhookAttemptModel(mongoose)

const DAY_IN_MS = 24 * 60 * 60 * 1000

const getSubmissionIndex = (
  submission: IEncryptedSubmissionSchema | IMultirespondentSubmissionSchema,
): number => {
  const submittedSteps = (submission as IMultirespondentSubmissionSchema)
    .submittedSteps
  // MRF: the latest submitted step is the one this send is for; storage-mode
  // submissions are single, so index 0.
  return Array.isArray(submittedSteps) && submittedSteps.length > 0
    ? submittedSteps.length - 1
    : 0
}

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

const createWebhookSubmissionView = (
  submissionWebhookView: WebhookView,
): Promise<WebhookView> => {
  // Generate S3 signed urls
  const signedUrlPromises: Record<string, Promise<string>> = {}
  for (const key in submissionWebhookView.data.attachmentDownloadUrls) {
    signedUrlPromises[key] = AwsConfig.s3.getSignedUrlPromise('getObject', {
      Bucket: AwsConfig.attachmentS3Bucket,
      Key: submissionWebhookView.data.attachmentDownloadUrls[key],
      Expires: 60 * 60, // one hour expiry
    })
  }

  return Bluebird.props(signedUrlPromises).then((signedUrls) => {
    submissionWebhookView.data.attachmentDownloadUrls = signedUrls
    return submissionWebhookView
  })
}

/**
 * Whether a webhook attempt should be persisted to `webhook_attempts`, per the
 * configured store mode. Single source of truth shared by the initial send and
 * the retry consumer.
 * - `on-every-send`: always.
 * - `on-failure`: only when the send failed AND a retry is being enqueued (so
 *   the record exists iff a retry exists, and the replay payload is present).
 */
export const shouldRecordWebhookAttempt = (
  didSucceed: boolean,
  willRetry: boolean,
): boolean => {
  if (
    webhooksAndVerifiedContentConfig.webhookAttemptStoreMode ===
    WebhookAttemptStoreMode.OnEverySend
  ) {
    return true
  }
  return !didSucceed && willRetry
}

/**
 * Persists a webhook attempt (outgoing body + outcome) to `webhook_attempts`
 * with a TTL-driven `expireAt`. Best-effort: a write failure is logged and
 * swallowed (resolves `false`) so it never aborts delivery; a missing record
 * just degrades a retry to live reconstruction.
 */
export const recordWebhookAttempt = (
  params: Omit<RecordWebhookAttemptParams, 'expireAt'>,
): ResultAsync<boolean, never> => {
  const expireAt = new Date(
    Date.now() +
      webhooksAndVerifiedContentConfig.webhookAttemptTtlDays * DAY_IN_MS,
  )
  return ResultAsync.fromPromise(
    WebhookAttempt.recordAttempt({ ...params, expireAt }),
    (error) => {
      logger.error({
        message: 'Failed to record webhook attempt',
        meta: {
          action: 'recordWebhookAttempt',
          submissionId: params.submissionId,
          submissionIndex: params.submissionIndex,
          attemptNumber: params.attemptNumber,
        },
        error,
      })
      return error
    },
  )
    .map(() => true)
    .orElse(() => okAsync(false))
}

/**
 * Reads the stored body to replay for a step's retry (attempt #0).
 * Resolves `null` if no attempt was stored (caller falls back to
 * reconstruction).
 */
export const getReplayWebhookView = (
  submissionId: string,
  submissionIndex: number,
): ResultAsync<WebhookView | null, never> => {
  return ResultAsync.fromPromise(
    WebhookAttempt.getReplayPayload(submissionId, submissionIndex),
    (error) => {
      logger.error({
        message: 'Failed to read stored webhook attempt for replay',
        meta: {
          action: 'getReplayWebhookView',
          submissionId,
          submissionIndex,
        },
        error,
      })
      return error
    },
  ).orElse(() => okAsync(null))
}

export const sendWebhook = (
  webhookView: WebhookView,
  webhookUrl: string,
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
      createWebhookSubmissionView(webhookView),
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

export const getWebhookType = (webhookUrl: string) => {
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
  ): ResultAsync<
    true,
    | WebhookValidationError
    | PossibleDatabaseError
    | SubmissionNotFoundError
    | WebhookPushToQueueError
  > => {
    // Attempt to send webhook

    const submissionIndex = getSubmissionIndex(submission)

    return ResultAsync.fromPromise(
      submission.getWebhookView(),
      () => new DatabaseError(),
    ).andThen((webhookView) => {
      // sendWebhook presigns attachment URLs in place; capture the pre-presign
      // view (stable S3 keys) for persistence + byte-stable replay before that.
      const payloadToStore = cloneDeep(webhookView)
      return sendWebhook(webhookView, webhookUrl).andThen((webhookResponse) => {
        webhookStatsdClient.increment('sent', 1, 1, {
          responseCode: `${webhookResponse.response.status || null}`,
          webhookType: getWebhookType(webhookUrl),
          isRetryEnabled: `${isRetryEnabled}`,
        })

        const didSucceed = isSuccessfulResponse(webhookResponse)
        const willRetry = !didSucceed && !!producer && isRetryEnabled

        // Save record of sending to database
        return saveWebhookRecord(submission._id, webhookResponse)
          .andThen(() =>
            // Record the attempt (the initial send is attempt #0). When a
            // retry will be enqueued this is the replay payload; the write is
            // best-effort, so a failure just degrades the retry to live
            // reconstruction.
            shouldRecordWebhookAttempt(didSucceed, willRetry)
              ? recordWebhookAttempt({
                  submissionId: submission._id,
                  submissionIndex,
                  formId: webhookView.data.formId,
                  webhookUrl,
                  attemptNumber: 0,
                  signature: webhookResponse.signature,
                  payload: payloadToStore,
                  response: { status: webhookResponse.response.status },
                  status: didSucceed ? 'success' : 'failure',
                })
              : okAsync(false),
          )
          .andThen(() => {
            // If webhook successful or retries not enabled, no further action
            if (didSucceed || !producer || !isRetryEnabled) {
              return okAsync(true as const)
            }
            // Webhook failed and retries enabled, so create initial message and enqueue
            return WebhookQueueMessage.fromSubmission(
              String(submission._id),
              submissionIndex,
            ).asyncAndThen((queueMessage) => producer.sendMessage(queueMessage))
          })
      })
    })
  }
