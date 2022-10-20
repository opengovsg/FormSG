import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import { ErrorDto, PrivateFormErrorDto } from 'shared/types'

import config from '../../config/config'
import { statsdClient } from '../../config/datadog-statsd-client'
import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import { PrivateFormError } from '../form/form.errors'
import * as FormService from '../form/form.service'
import * as PublicFormService from '../form/public-form/public-form.service'
import * as SubmissionService from '../submission/submission.service'

import * as FeedbackService from './feedback.service'
import { mapRouteError } from './feedback.util'

const logger = createLoggerWithLabel(module)

const validateSubmitFormFeedbackParams = celebrate({
  [Segments.BODY]: Joi.object()
    .keys({
      rating: Joi.number().min(1).max(5).cast('string').required(),
      comment: Joi.string().allow('').required(),
    })
    // Allow other keys for backwards compability as frontend might put extra keys in the body.
    .unknown(true),
})

/**
 * Handler for POST api/v3/forms/:formId/submissions/:submissionId/feedback endpoint
 * @precondition formId and submissionId should be present in req.params.
 * @precondition Joi validation should enforce shape of req.body before this handler is invoked.
 *
 * @returns 200 if feedback was successfully saved
 * @returns 404 if form with formId does not exist or is private, or submissionId does not exist
 * @returns 422 if duplicate feedback with the same submissionId and formId exists
 * @returns 410 if form has been archived
 * @returns 500 if database error occurs
 */
const submitFormFeedback: ControllerHandler<
  { formId: string; submissionId: string },
  { message: string } | ErrorDto | PrivateFormErrorDto,
  { rating: number; comment: string }
> = async (req, res) => {
  const { formId, submissionId } = req.params
  const { rating, comment } = req.body
  const logMeta = {
    action: 'submitFormFeedback',
    ...createReqMeta(req),
    formId,
    submissionId,
  }

  return SubmissionService.doesSubmissionIdExist(submissionId)
    .andThen(() => FeedbackService.hasNoPreviousFeedback(submissionId))
    .andThen(() => FormService.retrieveFullFormById(formId))
    .andThen((form) => FormService.isFormPublic(form).map(() => form))
    .andThen((form) => {
      statsdClient.distribution('formsg.feedback.rating', rating, 1, {
        rating: `${rating}`,
        ui:
          req.cookies?.[config.reactMigration.respondentCookieName] === 'react'
            ? 'react'
            : 'angular',
      })

      return PublicFormService.insertFormFeedback({
        formId: form._id,
        submissionId: submissionId,
        rating,
        comment,
      }).map(() =>
        res
          .status(StatusCodes.OK)
          .json({ message: 'Successfully submitted feedback' }),
      )
    })
    .mapErr((error) => {
      const { errorMessage, statusCode } = mapRouteError(error)
      logger.error({
        message: 'Error while submitting form feedback',
        meta: logMeta,
        error,
      })

      // Specialized error response for PrivateFormError.
      if (error instanceof PrivateFormError) {
        return res.status(statusCode).json({
          message: error.message,
          // Flag to prevent default 404 subtext ("please check link") from showing.
          isPageFound: true,
          formTitle: error.formTitle,
        })
      }
      return res.status(statusCode).json({ message: errorMessage })
    })
}

export const handleSubmitFormFeedback = [
  validateSubmitFormFeedbackParams,
  submitFormFeedback,
] as ControllerHandler[]
