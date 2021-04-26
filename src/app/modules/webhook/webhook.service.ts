import axios from 'axios'
import { get } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import {
  IEncryptedSubmissionSchema,
  ISubmissionSchema,
  IWebhookResponse,
  SubmissionWebhookInfo,
} from '../../../types'
import formsgSdk from '../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../config/logger'
import { getEncryptSubmissionModel } from '../../models/submission.server.model'
import { transformMongoError } from '../../utils/handle-mongo-error'
import { PossibleDatabaseError } from '../core/core.errors'
import { SubmissionNotFoundError } from '../submission/submission.errors'

import {
  WebhookFailedWithAxiosError,
  WebhookFailedWithUnknownError,
  WebhookValidationError,
} from './webhook.errors'
import { formatWebhookResponse } from './webhook.utils'
import { validateWebhookUrl } from './webhook.validation'

const logger = createLoggerWithLabel(module)
const EncryptSubmission = getEncryptSubmissionModel(mongoose)

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
  record: IWebhookResponse,
): ResultAsync<
  IEncryptedSubmissionSchema,
  PossibleDatabaseError | SubmissionNotFoundError
> => {
  return ResultAsync.fromPromise(
    EncryptSubmission.addWebhookResponse(submissionId, record),
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

export const sendWebhook = (
  submission: IEncryptedSubmissionSchema,
  webhookUrl: string,
): ResultAsync<
  IWebhookResponse,
  | WebhookValidationError
  | WebhookFailedWithAxiosError
  | WebhookFailedWithUnknownError
> => {
  const now = Date.now()
  const submissionWebhookView = submission.getWebhookView()
  const { submissionId, formId } = submissionWebhookView.data

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
  })
    .andThen(() =>
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
          maxRedirects: 0,
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
}

export const retrieveWebhookInfo = (
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
    if (!submissionInfo)
      return errAsync(
        new SubmissionNotFoundError(
          'Could not retrieve webhook info as submission was not found',
        ),
      )
    return okAsync(submissionInfo)
  })
