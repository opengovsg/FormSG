import { FieldResponse } from '../../../../../shared/types'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { ControllerHandler } from '../../core/core.types'

import * as SubmissionReceiver from './receiver.service'
import { mapRouteError } from './receiver.utils'

const logger = createLoggerWithLabel(module)

/**
 * Parses multipart-form data request. Parsed attachments are
 * placed into req.attachments and parsed fields are placed into
 * req.body.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const receiveSubmission: ControllerHandler<
  unknown,
  { message: string },
  { responses: FieldResponse[] }
> = async (req, res, next) => {
  const logMeta = {
    action: 'receiveSubmission',
    ...createReqMeta(req),
  }
  return SubmissionReceiver.createMultipartReceiver(req.headers)
    .asyncAndThen((receiver) => {
      const result = SubmissionReceiver.configureMultipartReceiver(receiver)
      req.pipe(receiver)
      return result
    })
    .map((parsed) => {
      req.body = parsed
      return next()
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while receiving multipart data',
        meta: logMeta,
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}
