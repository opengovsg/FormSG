import { RequestHandler } from 'express'
import { Query } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'
import JSONStream from 'JSONStream'
import moment from 'moment-timezone'

import { createLoggerWithLabel } from '../../../../config/logger'
import { CaptchaFactory } from '../../../services/captcha/captcha.factory'
import { createReqMeta, getRequestIp } from '../../../utils/request'
import { getFormAfterPermissionChecks } from '../../auth/auth.service'
import { PermissionLevel } from '../../form/admin-form/admin-form.types'
import * as FormService from '../../form/form.service'
import { getPopulatedUserById } from '../../user/user.service'

import {
  checkFormIsEncryptMode,
  getEncryptedSubmissionData,
  getSubmissionCursor,
  getSubmissionMetadata,
  getSubmissionMetadataList,
  transformAttachmentMetasToSignedUrls,
  transformAttachmentMetaStream,
} from './encrypt-submission.service'
import { mapRouteError } from './encrypt-submission.utils'

const logger = createLoggerWithLabel(module)

export const handleEncryptedSubmission: RequestHandler = async (
  req,
  res,
  next,
) => {
  const { formId } = req.params
  const logMeta = {
    action: 'handleEncryptedSubmission',
    ...createReqMeta(req),
    formId,
  }

  // Retrieve form
  const formResult = await FormService.retrieveFullFormById(formId)
  if (formResult.isErr()) {
    logger.warn({
      message: 'Failed to retrieve form from database',
      meta: logMeta,
      error: formResult.error,
    })
    const { errorMessage, statusCode } = mapRouteError(formResult.error)
    return res.status(statusCode).json({ message: errorMessage })
  }
  const form = formResult.value

  // Check that form is public
  const formPublicResult = FormService.isFormPublic(form)
  if (formPublicResult.isErr()) {
    logger.warn({
      message: 'Attempt to submit non-public form',
      meta: logMeta,
      error: formPublicResult.error,
    })
    const { statusCode } = mapRouteError(formPublicResult.error)
    if (statusCode == StatusCodes.GONE) {
      return res.status(statusCode)
    } else {
      return res.status(statusCode).json({
        message: form.inactiveMessage,
        isPageFound: true,
        formTitle: form.title,
      })
    }
  }

  // Check captcha
  if (form.hasCaptcha) {
    const captchaResult = await CaptchaFactory.verifyCaptchaResponse(
      req.query.captchaResponse,
      getRequestIp(req),
    )
    if (captchaResult.isErr()) {
      logger.error({
        message: 'Error while verifying captcha',
        meta: logMeta,
        error: captchaResult.error,
      })
      const { errorMessage, statusCode } = mapRouteError(captchaResult.error)
      return res.status(statusCode).json({ message: errorMessage })
    }
  }

  // Check that the form has not reached submission limits
  const formSubmissionLimitResult = await FormService.checkFormSubmissionLimitAndDeactivateForm(
    form,
  )
  if (formSubmissionLimitResult.isErr()) {
    logger.warn({
      message:
        'Attempt to submit form which has just reached submission limits',
      meta: logMeta,
      error: formSubmissionLimitResult.error,
    })
    const { statusCode } = mapRouteError(formSubmissionLimitResult.error)
    return res.status(statusCode).json({
      message: form.inactiveMessage,
      isPageFound: true,
      formTitle: form.title,
    })
  }

  return next()
}

/**
 * Handler for GET /:formId([a-fA-F0-9]{24})/adminform/submissions/download
 * @security session
 *
 * @returns 200 with stream of encrypted responses
 * @returns 400 if req.query.startDate or req.query.endDate is malformed
 * @returns 500 if any errors occurs in stream pipeline
 */
export const handleStreamEncryptedResponses: RequestHandler<
  { formId: string },
  unknown,
  unknown,
  Query & { startDate?: string; endDate?: string; downloadAttachments: boolean }
> = async (req, res) => {
  const sessionUserId = (req.session as Express.AuthedSession).user._id
  const { formId } = req.params
  const { startDate, endDate } = req.query

  // Step 1: Retrieve currently logged in user.
  // eslint-disable-next-line typesafe/no-await-without-trycatch
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
    .andThen(checkFormIsEncryptMode)
    // Step 4: Retrieve submissions cursor.
    .andThen(() =>
      getSubmissionCursor(formId, {
        startDate,
        endDate,
      }),
    )

  const logMeta = {
    action: 'handleStreamEncryptedResponses',
    ...createReqMeta(req),
    formId,
  }

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

/**
 * Handler for GET /:formId/adminform/submissions
 *
 * @returns 200 with encrypted submission data response
 * @returns 404 if submissionId cannot be found in the database
 * @returns 500 if any errors occurs in database query or generating signed URL
 */
export const handleGetEncryptedResponse: RequestHandler<
  { formId: string },
  unknown,
  unknown,
  { submissionId: string }
> = async (req, res) => {
  const { submissionId } = req.query
  const { formId } = req.params

  const logMeta = {
    action: 'handleGetEncryptedResponse',
    submissionId,
    formId,
  }

  // Step 1: Retrieve submission.
  const submissionResult = await getEncryptedSubmissionData(
    formId,
    submissionId,
  )

  if (submissionResult.isErr()) {
    logger.error({
      message: 'Failure retrieving encrypted submission from database',
      meta: logMeta,
      error: submissionResult.error,
    })

    const { statusCode, errorMessage } = mapRouteError(submissionResult.error)
    return res.status(statusCode).json({
      message: errorMessage,
    })
  }

  // Step 2: Retrieve presigned URLs for attachments.
  const submission = submissionResult.value
  // Remaining login duration in seconds.
  const urlExpiry = (req.session?.cookie.maxAge ?? 0) / 1000
  const presignedUrlsResult = await transformAttachmentMetasToSignedUrls(
    submission.attachmentMetadata,
    urlExpiry,
  )

  if (presignedUrlsResult.isErr()) {
    logger.error({
      message: 'Failure transforming attachment metadata into presigned URLs',
      meta: logMeta,
      error: presignedUrlsResult.error,
    })

    const { statusCode, errorMessage } = mapRouteError(
      presignedUrlsResult.error,
    )
    return res.status(statusCode).json({
      message: errorMessage,
    })
  }

  // Successfully retrieved both submission and transforming presigned URLs,
  // return to client.
  const responseData = {
    refNo: submission._id,
    submissionTime: moment(submission.created)
      .tz('Asia/Singapore')
      .format('ddd, D MMM YYYY, hh:mm:ss A'),
    content: submission.encryptedContent,
    verified: submission.verifiedContent,
    attachmentMetadata: presignedUrlsResult.value,
  }

  return res.json(responseData)
}

/**
 * Handler for GET /:formId([a-fA-F0-9]{24})/adminform/submissions/metadata
 *
 * @returns 200 with single submission metadata if query.submissionId is provided
 * @returns 200 with list of submission metadata with total count (and optional offset if query.page is provided) if query.submissionId is not provided
 * @returns 500 if any errors occurs whilst querying database
 */
export const handleGetMetadata: RequestHandler<
  { formId: string },
  unknown,
  unknown,
  Query & { page?: number; submissionId?: string }
> = async (req, res) => {
  const { formId } = req.params
  const { page, submissionId } = req.query

  const logMeta = {
    action: 'handleGetMetadata',
    formId,
    submissionId,
    page,
    ...createReqMeta(req),
  }

  // Specific query.
  if (submissionId) {
    return getSubmissionMetadata(formId, submissionId)
      .map((metadata) => {
        return metadata
          ? res.json({ metadata: [metadata], count: 1 })
          : res.json({ metadata: [], count: 0 })
      })
      .mapErr((error) => {
        logger.error({
          message: 'Failure retrieving metadata from database',
          meta: logMeta,
          error,
        })

        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({
          message: errorMessage,
        })
      })
  }

  // General query
  return getSubmissionMetadataList(formId, page)
    .map((result) => res.json(result))
    .mapErr((error) => {
      logger.error({
        message: 'Failure retrieving metadata list from database',
        meta: logMeta,
        error,
      })

      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({
        message: errorMessage,
      })
    })
}
