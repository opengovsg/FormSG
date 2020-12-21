import { RequestHandler } from 'express'
import { SetOptional } from 'type-fest'

import { createReqMeta } from '../../../../app/utils/request'
import { createLoggerWithLabel } from '../../../../config/logger'
import { WithForm, WithParsedResponses } from '../../../../types'
import { checkIsEncryptedEncoding } from '../../../utils/encryption'
import { getProcessedResponses } from '../submission.service'

import {
  EncryptSubmissionBody,
  EncryptSubmissionBodyAfterProcess,
  WithAttachmentsData,
  WithFormData,
} from './encrypt-submission.types'
import { mapRouteError } from './encrypt-submission.utils'

const logger = createLoggerWithLabel(module)

/**
 * Extracts relevant fields, injects questions, verifies visibility of field and validates answers
 * to produce req.body.parsedResponses
 *
 * @param  {Express.Request} req - Express request object
 * @param  {Express.Response} res - Express response object
 * @param  {Function} next - Express next middleware function
 */

export const validateAndProcessEncryptSubmission: RequestHandler<
  { formId: string },
  unknown,
  EncryptSubmissionBody
> = (req, res, next) => {
  const { form } = req as WithForm<typeof req>
  const { encryptedContent, responses } = req.body

  // Step 1: Check whether submitted encryption is valid.
  return (
    checkIsEncryptedEncoding(encryptedContent)
      // Step 2: Encryption is valid, process given responses.
      .andThen(() => getProcessedResponses(form, responses))
      // If pass, then set parsedResponses and delete responses.
      .map((processedResponses) => {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        ;(req.body as WithParsedResponses<
          typeof req.body
        >).parsedResponses = processedResponses
        // Prevent downstream functions from using responses by deleting it.
        delete (req.body as SetOptional<EncryptSubmissionBody, 'responses'>)
          .responses
        return next()
      })
      // If error, log and return res error.
      .mapErr((error) => {
        logger.error({
          message:
            'Error validating and processing encrypt submission responses',
          meta: {
            action: 'validateAndProcessEncryptSubmission',
            ...createReqMeta(req),
            formId: form._id,
          },
          error,
        })

        const { statusCode, errorMessage } = mapRouteError(error)
        return res.status(statusCode).json({
          message: errorMessage,
        })
      })
  )
}

/**
 * Verify structure of encrypted response
 *
 * @param  {Express.Request} req - Express request object
 * @param  {Express.Response} res - Express response object
 * @param  {Function} next - Express next middleware function
 */

export const prepareEncryptSubmission: RequestHandler<
  { formId: string },
  unknown,
  EncryptSubmissionBodyAfterProcess
> = (req, res, next) => {
  // Step 1: Add req.body.encryptedContent to req.formData
  // eslint-disable-next-line @typescript-eslint/no-extra-semi
  ;(req as WithFormData<typeof req>).formData = req.body.encryptedContent
  // Step 2: Add req.body.attachments to req.attachmentData
  ;(req as WithAttachmentsData<typeof req>).attachmentData =
    req.body.attachments || {}
  return next()
}
