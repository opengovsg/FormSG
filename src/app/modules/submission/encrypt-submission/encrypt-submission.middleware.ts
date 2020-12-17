import { RequestHandler } from 'express'
import { SetOptional } from 'type-fest'

import { createReqMeta } from '../../../../app/utils/request'
import { createLoggerWithLabel } from '../../../../config/logger'
import { FieldResponse, WithForm, WithParsedResponses } from '../../../../types'
import { checkIsEncryptedEncoding } from '../../../utils/encryption'
import { getProcessedResponses } from '../submission.service'

import { mapRouteError } from './encrypt-submission.utils'

const logger = createLoggerWithLabel(module)

type EncryptSubmissionBody = {
  responses: FieldResponse[]
  encryptedContent: string
  attachments?: {
    encryptedFile?: {
      binary: string
      nonce: string
      submissionPublicKey: string
    }
  }
  isPreview: boolean
  version: number
}

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
          message: 'Error validating encrypt submission responses',
          meta: {
            action: 'validateEncryptSubmission',
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
