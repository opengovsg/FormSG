import { celebrate, Joi } from 'celebrate'

import { BasicField, FieldResponse } from '../../../../../shared/types'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { ControllerHandler } from '../../core/core.types'

import * as EmailSubmissionReceiver from './email-submission.receiver'
import { mapRouteError } from './email-submission.util'

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
export const receiveEmailSubmission: ControllerHandler<
  unknown,
  { message: string },
  { responses: FieldResponse[] }
> = async (req, res, next) => {
  const logMeta = {
    action: 'receiveEmailSubmission',
    ...createReqMeta(req),
  }
  return EmailSubmissionReceiver.createMultipartReceiver(req.headers)
    .asyncAndThen((receiver) => {
      const result =
        EmailSubmissionReceiver.configureMultipartReceiver(receiver)
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

/**
 * Celebrate validation for the email submissions endpoint.
 */
export const validateResponseParams = celebrate({
  body: Joi.object({
    responses: Joi.array()
      .items(
        Joi.object()
          .keys({
            _id: Joi.string().required(),
            question: Joi.string(),
            fieldType: Joi.string()
              .required()
              .valid(...Object.values(BasicField)),
            answer: Joi.string().allow(''),
            answerArray: Joi.array(),
            filename: Joi.string(),
            content: Joi.binary(),
            isHeader: Joi.boolean(),
            myInfo: Joi.object(),
            signature: Joi.string().allow(''),
          })
          .xor('answer', 'answerArray') // only answer or answerArray can be present at once
          .with('filename', 'content'), // if filename is present, content must be present
      )
      .required(),
    responseMetadata: Joi.object({
      responseTimeMs: Joi.number(),
      numVisibleFields: Joi.number(),
    }),
    /**
     * @deprecated unused key, but frontend still sends it.
     */
    isPreview: Joi.boolean(),
  }),
})
