import { celebrate, Joi, Segments } from 'celebrate'
import { NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { errAsync } from 'neverthrow'
import { FieldResponsesV3 } from 'shared/types'

import formsgSdk from '../../config/formsg-sdk'
import { createLoggerWithLabel } from '../../config/logger'
import MailService from '../../services/mail/mail.service'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'
import { getQuestionTitleAnswerString } from '../submission/multirespondent-submission/multirespondent-submission.utils'
import * as SubmissionService from '../submission/submission.service'

import {
  DecryptRespondentCopySubmissionHandlerType,
  DecryptRespondentCopySubmissionRequest,
} from './respondent-copy.types'
import { mapRouteError } from './respondent-copy.util'

const logger = createLoggerWithLabel(module)

const validateSubmitFormRespondentCopyParams = celebrate({
  [Segments.BODY]: Joi.object()
    .keys({
      emails: Joi.array().items(Joi.string()),
      respondentCopySecretKey: Joi.string().required(),
      respondentCopyPresignedUrl: Joi.string().required(),
      mrfStep: Joi.number().optional(),
    })
    // Allow other keys for backwards compability as frontend might put extra keys in the body.
    .unknown(true),
})

const decryptRespondentCopySubmission = async (
  req: DecryptRespondentCopySubmissionRequest,
  res: Parameters<DecryptRespondentCopySubmissionHandlerType>[1],
  next: NextFunction,
) => {
  const { respondentCopySecretKey, respondentCopyPresignedUrl, mrfStep } =
    req.body

  // decrypt responses
  const decryptedContent = formsgSdk.cryptoV3.decryptFromSubmissionKey(
    respondentCopySecretKey,
    {
      encryptedContent: respondentCopyPresignedUrl,
      version: 2.1,
    },
  )

  if (!decryptedContent) throw new Error('Could not decrypt the response')

  // req.unencryptedContent = mrfStep
  //   ? (decryptedContent.responses as FieldResponsesV3)
  // : (decryptedContent.responses as FieldResponses[])

  req.unencryptedContent = decryptedContent.responses as FieldResponsesV3

  console.log(
    `THIS IS THE DECRYPTED RESPONSES ${JSON.stringify(req.unencryptedContent)}`,
  )

  return next()
}

const submitFormRespondentCopy = async (
  req: DecryptRespondentCopySubmissionRequest,
  res: Parameters<DecryptRespondentCopySubmissionHandlerType>[1],
) => {
  const { formId, submissionId } = req.params
  const { emails } = req.body
  const logMeta = {
    action: 'submitFormRespondentCopy',
    ...createReqMeta(req),
    formId,
    submissionId,
  }

  return SubmissionService.doesSubmissionIdExist(submissionId)
    .andThen(() =>
      FormService.retrieveFullFormById(formId).mapErr((error) => {
        logger.warn({
          message: 'Failed to retrieve form from database',
          meta: logMeta,
          error,
        })
        const { errorMessage, statusCode } = mapRouteError(error)
        return res.status(statusCode).json({ message: errorMessage })
      }),
    )
    .andThen((form) => FormService.isFormPublic(form).map(() => form))
    .andThen((form) => {
      const formQuestionAnswers = getQuestionTitleAnswerString({
        formFields: form.form_fields,
        responses: req.unencryptedContent,
      })
      return MailService.sendMrfRespondentCopyEmail({
        emails: emails,
        formId: formId,
        formTitle: 'TEST TITLE', //TODO fix this
        responseId: submissionId,
        formQuestionAnswers,
      })
        .orElse((error) => {
          logger.error({
            message: 'Failed to send respondent copy email',
            meta: {
              action: 'sendMrfRespondentCopyEmail',
              formId: form._id,
              submissionId,
            },
            error,
          })
          return errAsync(error)
        })
        .map(() =>
          res
            .status(StatusCodes.OK)
            .json({ message: 'Successfully submitted respondent copy emails' }),
        )
      // return res
      //   .status(StatusCodes.OK)
      //   .json({ message: 'Successfully submitted respondent copy emails' })
    })
}

export const handleSubmitFormRespondentCopy = [
  validateSubmitFormRespondentCopyParams,
  decryptRespondentCopySubmission,
  submitFormRespondentCopy,
] as ControllerHandler[]

// .andThen((form) => {
//   console.log(`SENDING RESPONDENT COPIES`)
//   return [1, 2, 3] //TODO: update to actually send respondent copies
//     .map(() =>
//       res
//         .status(StatusCodes.OK)
//         .json({ message: 'Successfully submitted respondent copy emails' }),
//     )
// })
// .mapErr((error) => {
//   const { errorMessage, statusCode } = mapRouteError(error)
//   logger.error({
//     message: 'Error while submitting form feedback',
//     meta: logMeta,
//     error,
//   })
//   return res.status(statusCode).json({ message: errorMessage })
// })
