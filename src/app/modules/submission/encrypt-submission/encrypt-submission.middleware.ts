import { celebrate, Joi, Segments } from 'celebrate'

import { BasicField, FieldResponse } from '../../../../../shared/types'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { ControllerHandler } from '../../core/core.types'
// TODO (Encrypt Boundary): Rename email-submission.receiver as more generic submission receiver
import * as SubmissionReceiver from '../email-submission/email-submission.receiver'

import { mapRouteError } from './encrypt-submission.utils'

const logger = createLoggerWithLabel(module)

/**
 * Parses multipart-form data request from createdStorageModeUnencryptedSubmissionData. Parsed attachments are
 * placed into req.attachments and parsed fields are placed into
 * req.body.
 *
 * TODO (Encrypt Boundary): Check that paymentReceiptEmail is properly handled
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const receiveEncryptSubmission: ControllerHandler<
  unknown,
  { message: string },
  { responses: FieldResponse[]; paymentReceiptEmail?: string }
> = async (req, res, next) => {
  const logMeta = {
    action: 'receiveEncryptSubmission',
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

/**
 * Celebrate middleware for verifying shape of unencrypted storage mode submisison
 */
export const validateUnencryptedSubmissionParams = celebrate({
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
    paymentReceiptEmail: Joi.string().email().optional(),
    /**
     * @deprecated unused key, but frontend still sends it.
     */
    isPreview: Joi.boolean(),
  }),
})

/**
 * Celebrate middleware for verifying shape of encrypted submission
 */
export const validateEncryptSubmissionParams = celebrate({
  [Segments.BODY]: Joi.object({
    responses: Joi.array()
      .items(
        Joi.object().keys({
          _id: Joi.string().required(),
          answer: Joi.string().allow('').required(),
          fieldType: Joi.string()
            .required()
            .valid(...Object.values(BasicField)),
          signature: Joi.string().allow(''),
        }),
      )
      .required(),
    encryptedContent: Joi.string()
      .custom((value, helpers) => {
        const parts = String(value).split(/;|:/)
        if (
          parts.length !== 3 ||
          parts[0].length !== 44 || // public key
          parts[1].length !== 32 || // nonce
          !parts.every((part) => Joi.string().base64().validate(part))
        ) {
          return helpers.message({ custom: 'Invalid encryptedContent.' })
        }
        return value
      }, 'encryptedContent')
      .required(),
    attachments: Joi.object()
      .pattern(
        /^[a-fA-F0-9]{24}$/,
        Joi.object().keys({
          encryptedFile: Joi.object()
            .keys({
              binary: Joi.string().required(),
              nonce: Joi.string().required(),
              submissionPublicKey: Joi.string().required(),
            })
            .required(),
        }),
      )
      .optional(),
    paymentReceiptEmail: Joi.string(),
    /**
     * @deprecated unused key, but frontend may still send it.
     */
    isPreview: Joi.boolean(),
    version: Joi.number().required(),
  }),
})
