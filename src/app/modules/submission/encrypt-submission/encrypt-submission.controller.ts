import { RequestHandler } from 'express'
import { ParamsDictionary, Query } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'
import JSONStream from 'JSONStream'
import moment from 'moment-timezone'

import { createLoggerWithLabel } from '../../../../config/logger'
import { WithForm } from '../../../../types'
import { createReqMeta } from '../../../utils/request'

import {
  getEncryptedSubmissionData,
  getSubmissionCursor,
  getSubmissionMetadata,
  getSubmissionMetadataList,
  transformAttachmentMetasToSignedUrls,
  transformAttachmentMetaStream,
} from './encrypt-submission.service'
import { mapRouteError } from './encrypt-submission.utils'

const logger = createLoggerWithLabel(module)

/**
 * Handler for GET /:formId([a-fA-F0-9]{24})/adminform/submissions/download
 *
 * @returns 200 with stream of encrypted responses
 * @returns 400 if req.query.startDate or req.query.endDate is malformed
 * @returns 500 if any errors occurs in stream pipeline
 */
export const handleStreamEncryptedResponses: RequestHandler<
  ParamsDictionary,
  unknown,
  unknown,
  Query & { startDate?: string; endDate?: string; downloadAttachments: boolean }
> = async (req, res) => {
  const { startDate, endDate } = req.query

  // TODO (#42): Remove typecast once app has migrated away from middlewares.
  const formId = (req as WithForm<typeof req>).form._id

  const cursorResult = getSubmissionCursor(formId, {
    startDate,
    endDate,
  })

  const logMeta = {
    action: 'handleStreamEncryptedResponses',
    ...createReqMeta(req),
    formId,
  }

  if (cursorResult.isErr()) {
    logger.error({
      message: 'Given date query params are malformed',
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
  Query & { page: number; submissionId?: string }
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
