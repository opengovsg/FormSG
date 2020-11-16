import { RequestHandler } from 'express'
import { ParamsDictionary, Query } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'
import JSONStream from 'JSONStream'

import { createLoggerWithLabel } from '../../../../config/logger'
import { IPopulatedForm } from '../../../../types'
import { createReqMeta } from '../../../utils/request'

import {
  getSubmissionCursor,
  transformAttachmentMetaStream,
} from './encrypt-submission.service'
import { mapRouteError } from './encrypt-submission.utils'

const logger = createLoggerWithLabel(module)

type WithForm<T> = T & {
  form: IPopulatedForm
}

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
