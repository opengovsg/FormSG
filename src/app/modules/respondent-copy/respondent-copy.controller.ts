import { celebrate, Joi, Segments } from 'celebrate'
import { NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { errAsync } from 'neverthrow'
import { randomBytes, secretbox } from 'tweetnacl'
import { decodeBase64, encodeUTF8 } from 'tweetnacl-util'

import { createLoggerWithLabel } from '../../config/logger'
import MailService from '../../services/mail/mail.service'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'
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
  // const decryptedContent = formsgSdk.cryptoV3.decryptFromSubmissionKey(
  //   respondentCopySecretKey,
  //   {
  //     encryptedContent: respondentCopyPresignedUrl,
  //     version: 2.1,
  //   },
  // )

  const decrypt = (messageWithNonce, key) => {
    const keyUint8Array = decodeBase64(key)
    const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce)
    const nonce = messageWithNonceAsUint8Array.slice(0, secretbox.nonceLength)
    const message = messageWithNonceAsUint8Array.slice(
      secretbox.nonceLength,
      messageWithNonce.length,
    )

    const decrypted = secretbox.open(message, nonce, keyUint8Array)

    const base64DecryptedMessage = encodeUTF8(decrypted)
    // return JSON.parse(base64DecryptedMessage)
    return base64DecryptedMessage
  }

  let decryptedContent
  try {
    decryptedContent = decrypt(
      respondentCopyPresignedUrl,
      respondentCopySecretKey,
    )
  } catch (e) {
    logger.error({
      message: 'Failed to decrypt respondent copy URL',
      meta: {
        action: 'sendMrfRespondentCopyEmail',
        error: e,
      },
    })
  }

  if (!decryptedContent) throw new Error('Could not decrypt the response')

  // req.unencryptedContent = mrfStep
  //   ? (decryptedContent.responses as FieldResponsesV3)
  // : (decryptedContent.responses as FieldResponses[])

  req.unencryptedContent = decryptedContent

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
  const { emails, mrfStep } = req.body
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
      // if (!mrfStep) {
      //   //TODO: update with customized email notifications
      //   const recipientData: AutoReplyMailData[] = emails
      //     ? emails?.map((val) => {
      //         return {
      //           email: val,
      //           // subject: '',
      //           // sender: '',
      //           // body: '',
      //           includeFormSummary: true,
      //         }
      //       })
      //     : []
      //   return MailService.sendAutoReplyEmails({
      //     form,
      //     submission,
      //     responsesData,
      //     autoReplyMailDatas: recipientData, //TODO: based on whitelist, update autoReplyMaildata
      //   })
      // }

      return MailService.sendRespondentCopyEmail({
        emails: emails,
        formId: formId,
        formTitle: 'TEST TITLE', //TODO fix this
        responseId: submissionId,
        mailHtml: req.unencryptedContent,
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
