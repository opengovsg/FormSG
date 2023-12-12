import JoiDate from '@joi/date'
import { celebrate, Joi as BaseJoi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { StatusCodes } from 'http-status-codes'
import JSONStream from 'JSONStream'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import {
  ErrorDto,
  FormSubmissionMetadataQueryDto,
  SubmissionDto,
  SubmissionMetadataList,
  SubmissionPaymentDto,
  SubmissionType,
} from '../../../../shared/types'
import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { getFormAfterPermissionChecks } from '../auth/auth.service'
import { DatabaseError } from '../core/core.errors'
import { ControllerHandler } from '../core/core.types'
import { PermissionLevel } from '../form/admin-form/admin-form.types'
import { PaymentNotFoundError } from '../payments/payments.errors'
import { getPopulatedUserById } from '../user/user.service'

import { transformAttachmentMetasToSignedUrls } from './encrypt-submission/encrypt-submission.service'
import {
  createStorageModeSubmissionDto,
  mapRouteError,
} from './encrypt-submission/encrypt-submission.utils'
import { createMultirespondentSubmissionDto } from './multirespondent-submission/multirespondent-submission.utils'
import { InvalidSubmissionTypeError } from './submission.errors'
import {
  addPaymentDataStream,
  getEncryptedSubmissionData,
  getSubmissionCursor,
  getSubmissionMetadata,
  getSubmissionMetadataList,
  getSubmissionPaymentDto,
  transformAttachmentMetaStream,
} from './submission.service'
import { checkFormIsEncryptModeOrMultirespondent } from './submission.utils'

const logger = createLoggerWithLabel(module)

// NOTE: Refer to this for documentation: https://github.com/sideway/joi-date/blob/master/API.md
const Joi = BaseJoi.extend(JoiDate)

/**
 * Handler for GET /:formId/submissions/metadata
 * This is exported solely for testing purposes
 *
 * @returns 200 with single submission metadata if query.submissionId is provided
 * @returns 200 with list of submission metadata with total count (and optional offset if query.page is provided) if query.submissionId is not provided
 * @returns 400 if form is not an encrypt or multirespondent form
 * @returns 403 when user does not have read permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 if any errors occurs whilst querying database
 */
export const getMetadata: ControllerHandler<
  { formId: string },
  SubmissionMetadataList | ErrorDto,
  unknown,
  FormSubmissionMetadataQueryDto
> = async (req, res) => {
  const sessionUserId = (req.session as AuthedSessionData).user._id
  const { formId } = req.params
  const { page, submissionId } = req.query

  const logMeta = {
    action: 'handleGetMetadata',
    formId,
    submissionId,
    page,
    sessionUserId,
    ...createReqMeta(req),
  }

  return (
    // Step 1: Retrieve logged in user.
    getPopulatedUserById(sessionUserId)
      .andThen((user) =>
        // Step 2: Check whether user has read permissions to form.
        getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Read,
        }),
      )
      // Step 3: Check whether form is encrypt mode.
      .andThen(checkFormIsEncryptModeOrMultirespondent)
      // Step 4: Retrieve submission metadata.
      .andThen((form) => {
        // Step 4a: Retrieve specific submission id.
        if (submissionId) {
          return getSubmissionMetadata(
            form.responseMode,
            formId,
            submissionId,
          ).map((metadata) => {
            const metadataList: SubmissionMetadataList = metadata
              ? { metadata: [metadata], count: 1 }
              : { metadata: [], count: 0 }
            return metadataList
          })
        }
        // Step 4b: Retrieve all submissions of given form id.
        return getSubmissionMetadataList(form.responseMode, formId, page)
      })
      .map((metadataList) => {
        logger.info({
          message: 'Successfully retrieved metadata from database',
          meta: logMeta,
        })
        return res.json(metadataList)
      })
      .mapErr((error) => {
        logger.error({
          message: 'Failure retrieving metadata from database',
          meta: logMeta,
          error,
        })

        const { statusCode, errorMessage } = mapRouteError(error) //TODO(MRF): Move errors + maprouteerror out of encrypt-submission folder.
        return res.status(statusCode).json({
          message: errorMessage,
        })
      })
  )
}

// Handler for GET /:formId/submissions/metadata
export const handleGetMetadata = [
  // NOTE: If submissionId is set, then page is optional.
  // Otherwise, if there is no submissionId, then page >= 1
  celebrate({
    [Segments.QUERY]: {
      submissionId: Joi.string().optional(),
      page: Joi.number().min(1).when('submissionId', {
        not: Joi.exist(),
        then: Joi.required(),
      }),
    },
  }),
  getMetadata,
] as ControllerHandler[]

/**
 * Handler for GET /:formId/submissions/:submissionId
 * @security session
 *
 * @returns 200 with encrypted submission data response
 * @returns 400 when form is not an encrypt mode form
 * @returns 403 when user does not have read permissions for form
 * @returns 404 when submissionId cannot be found in the database
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when any errors occurs in database query, generating signed URL or retrieving payment data
 */
export const handleGetEncryptedResponse: ControllerHandler<
  { formId: string; submissionId: string },
  SubmissionDto | ErrorDto
> = async (req, res) => {
  const sessionUserId = (req.session as AuthedSessionData).user._id
  const { formId, submissionId } = req.params

  const logMeta = {
    action: 'handleGetEncryptedResponse',
    submissionId,
    formId,
    sessionUserId,
    ...createReqMeta(req),
  }

  logger.info({
    message: 'Get encrypted response using submissionId start',
    meta: logMeta,
  })

  return (
    // Step 1: Retrieve logged in user.
    getPopulatedUserById(sessionUserId)
      // Step 2: Check whether user has read permissions to form.
      .andThen((user) =>
        getFormAfterPermissionChecks({
          user,
          formId,
          level: PermissionLevel.Read,
        }),
      )
      // Step 3: Check whether form is encrypt mode.
      .andThen(checkFormIsEncryptModeOrMultirespondent)
      // Step 4: Is encrypt mode form, retrieve submission data.
      .andThen((form) =>
        getEncryptedSubmissionData(form.responseMode, formId, submissionId),
      )
      // Step 5: If there is an associated payment, get the payment details.
      .andThen((submissionData) => {
        switch (submissionData.submissionType) {
          case SubmissionType.Encrypt: {
            const paymentDataResult: ResultAsync<
              SubmissionPaymentDto | undefined,
              DatabaseError | PaymentNotFoundError
            > = !submissionData.paymentId
              ? okAsync(undefined)
              : getSubmissionPaymentDto(submissionData.paymentId)

            return (
              paymentDataResult
                // Step 6: Retrieve presigned URLs for attachments.
                .andThen((paymentData) => {
                  // Remaining login duration in seconds.
                  const urlExpiry = (req.session?.cookie.maxAge ?? 0) / 1000
                  return transformAttachmentMetasToSignedUrls(
                    submissionData.attachmentMetadata,
                    urlExpiry,
                  ).map((presignedUrls) =>
                    createStorageModeSubmissionDto(
                      submissionData,
                      presignedUrls,
                      paymentData,
                    ),
                  )
                })
            )
          }
          case SubmissionType.Multirespondent: {
            //TODO(MRF): Attachment handling
            return okAsync(
              createMultirespondentSubmissionDto(submissionData, {}),
            )
          }
          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _: never = submissionData
            return errAsync(new InvalidSubmissionTypeError())
          }
        }
      })
      .map((responseData) => {
        logger.info({
          message: 'Get encrypted response using submissionId success',
          meta: logMeta,
        })
        return res.json(responseData)
      })
      .mapErr((error) => {
        logger.error({
          message: 'Failure retrieving encrypted submission response',
          meta: logMeta,
          error,
        })

        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({
          message: errorMessage,
        })
      })
  )
}

// Validates that the ending date >= starting date
const validateDateRange = celebrate({
  [Segments.QUERY]: Joi.object()
    .keys({
      startDate: Joi.date().format('YYYY-MM-DD').raw(),
      endDate: Joi.date().format('YYYY-MM-DD').min(Joi.ref('startDate')).raw(),
      downloadAttachments: Joi.boolean().default(false),
    })
    .and('startDate', 'endDate'),
})

/**
 * Handler for GET /:formId([a-fA-F0-9]{24})/submissions/download
 * NOTE: This is exported solely for testing
 * Streams and downloads for GET /:formId([a-fA-F0-9]{24})/adminform/submissions/download
 * @security session
 *
 * @returns 200 with stream of encrypted responses
 * @returns 400 if form is not an encrypt mode form
 * @returns 400 if req.query.startDate or req.query.endDate is malformed
 * @returns 403 when user does not have read permissions for form
 * @returns 404 when form cannot be found
 * @returns 410 when form is archived
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 if any errors occurs in stream pipeline or error retrieving form
 */
export const streamEncryptedResponses: ControllerHandler<
  { formId: string },
  unknown,
  unknown,
  { startDate?: string; endDate?: string; downloadAttachments: boolean }
> = async (req, res) => {
  const sessionUserId = (req.session as AuthedSessionData).user._id
  const { formId } = req.params
  const { startDate, endDate } = req.query

  const logMeta = {
    action: 'handleStreamEncryptedResponses',
    ...createReqMeta(req),
    formId,
    sessionUserId,
  }

  logger.info({
    message: 'Stream encrypted responses start',
    meta: logMeta,
  })

  // Step 1: Retrieve currently logged in user.
  const cursorResult = await getPopulatedUserById(sessionUserId)
    .andThen((user) =>
      // Step 2: Check whether user has read permissions to form
      getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Read,
      }),
    )
    // Step 3: Check whether form is encrypt mode.
    .andThen(checkFormIsEncryptModeOrMultirespondent)
    // Step 4: Retrieve submissions cursor.
    .andThen((form) =>
      getSubmissionCursor(form.responseMode, formId, {
        startDate,
        endDate,
      }),
    )

  if (cursorResult.isErr()) {
    logger.error({
      message: 'Error occurred whilst retrieving submission cursor',
      meta: logMeta,
      error: cursorResult.error,
    })

    const { statusCode, errorMessage } = mapRouteError(cursorResult.error)
    return res.status(statusCode).json({
      message: errorMessage,
    })
  }

  const cursor = cursorResult.value

  cursor
    .on('error', (error) => {
      logger.error({
        message: 'Error streaming submissions from database',
        meta: logMeta,
        error,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error retrieving from database.',
      })
    })
    .pipe(
      transformAttachmentMetaStream({
        enabled: req.query.downloadAttachments,
        urlValidDuration: (req.session?.cookie.maxAge ?? 0) / 1000,
      }),
    )
    // TODO: Can we include this within the cursor query as aggregation pipeline
    // instead, so that we make one query to mongo rather than two.
    .pipe(addPaymentDataStream())
    .on('error', (error) => {
      logger.error({
        message: 'Error retrieving URL for attachments',
        meta: logMeta,
        error,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error retrieving URL for attachments',
      })
    })
    // If you call JSONStream.stringify(false) the elements will only be
    // seperated by a newline.
    .pipe(JSONStream.stringify(false))
    .on('error', (error) => {
      logger.error({
        message: 'Error converting submissions to JSON',
        meta: logMeta,
        error,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error converting submissions to JSON',
      })
    })
    .pipe(res.type('application/x-ndjson'))
    .on('error', (error) => {
      logger.error({
        message: 'Error writing submissions to HTTP stream',
        meta: logMeta,
        error,
      })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Error writing submissions to HTTP stream',
      })
    })
    .on('close', () => {
      logger.info({
        message: 'Stream encrypted responses closed',
        meta: logMeta,
      })

      return res.end()
    })
}

// Handler for GET /:formId([a-fA-F0-9]{24})/submissions/download
export const handleStreamEncryptedResponses = [
  validateDateRange,
  streamEncryptedResponses,
] as ControllerHandler[]
