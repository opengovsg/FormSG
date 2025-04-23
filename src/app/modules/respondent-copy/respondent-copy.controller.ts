import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import { ErrorDto } from 'shared/types'

import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import * as FormService from '../form/form.service'
import * as SubmissionService from '../submission/submission.service'

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

const submitFormRespondentCopy: ControllerHandler<
  { formId: string; submissionId: string },
  { message: string } | ErrorDto, //TODO: Add errors
  {
    emails: string[]
    respondentCopySecretKey: string
    respondentCopyPresignedUrl: string
    mrfStep?: number
  }
> = async (req, res) => {
  const { formId, submissionId } = req.params
  const {
    emails,
    respondentCopySecretKey,
    respondentCopyPresignedUrl,
    mrfStep,
  } = req.body
  const logMeta = {
    action: 'submitFormRespondentCopy',
    ...createReqMeta(req),
    formId,
    submissionId,
  }

  return SubmissionService.doesSubmissionIdExist(submissionId)
    .andThen(() => FormService.retrieveFullFormById(formId))
    .andThen((form) => FormService.isFormPublic(form).map(() => form))
    .andThen((form) => {
      console.log(`SENDING RESPONDENT COPIES`)
      return [1, 2, 3] //TODO: update to actually send respondent copies
        .map(() =>
          res
            .status(StatusCodes.OK)
            .json({ message: 'Successfully submitted respondent copy emails' }),
        )
    })
    // .mapErr((error) => {
    //   const { errorMessage, statusCode } = mapRouteError(error)
    //   logger.error({
    //     message: 'Error while submitting form feedback',
    //     meta: logMeta,
    //     error,
    //   })
    //   return res.status(statusCode).json({ message: errorMessage })
    // })
}

export const handleSubmitFormRespondentCopy = [
  validateSubmitFormRespondentCopyParams,
  submitFormRespondentCopy,
] as ControllerHandler[]
