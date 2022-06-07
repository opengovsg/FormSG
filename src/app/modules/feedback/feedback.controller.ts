import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import { ErrorDto, PrivateFormErrorDto } from 'shared/types'

import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'
import { PrivateFormError } from '../form/form.errors'
import * as FormService from '../form/form.service'
import * as PublicFormService from '../form/public-form/public-form.service'
import { mapRouteError } from '../form/public-form/public-form.utils'
import * as SubmissionService from '../submission/submission.service'

import * as FeedbackService from './feedback.service'

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

export const submitFormFeedback: ControllerHandler<
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

  const checkDoesSubmissionIdExistRes =
    await SubmissionService.checkDoesSubmissionIdExist(submissionId)
  if (checkDoesSubmissionIdExistRes.isErr()) {
    const { error } = checkDoesSubmissionIdExistRes
    logger.error({
      message: 'Failed to check if submissionId exists',
      meta: logMeta,
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  const isSubmissionIdValid = checkDoesSubmissionIdExistRes.value
  if (!isSubmissionIdValid) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: 'SubmissionId is not valid' })
  }

  const checkHasPreviousFeedbackRes =
    await FeedbackService.checkHasPreviousFeedback(formId, submissionId)
  if (checkHasPreviousFeedbackRes.isErr()) {
    const { error } = checkHasPreviousFeedbackRes
    logger.error({
      message:
        'Failed to check if feedback has already been submitted previously',
      meta: logMeta,
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  const hasPreviousFeedback = checkHasPreviousFeedbackRes.value
  if (hasPreviousFeedback) {
    return res
      .status(StatusCodes.UNPROCESSABLE_ENTITY)
      .json({ message: 'Multiple feedbacks has already been submitted' })
  }

  const formResult = await FormService.retrieveFullFormById(formId)
  if (formResult.isErr()) {
    const { error } = formResult
    logger.error({
      message: 'Failed to retrieve form',
      meta: logMeta,
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  const form = formResult.value
  const isPublicResult = FormService.isFormPublic(form)
  if (isPublicResult.isErr()) {
    const { error } = isPublicResult
    logger.error({
      message: 'Form is not public',
      meta: logMeta,
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)

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
  }

  return PublicFormService.insertFormFeedback({
    formId: form._id,
    submissionId: submissionId,
    rating,
    comment,
  })
    .map(() =>
      res
        .status(StatusCodes.OK)
        .json({ message: 'Successfully submitted feedback' }),
    )
    .mapErr((error) => {
      logger.error({
        message: 'Error creating form feedback',
        meta: logMeta,
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

export const handleSubmitFormFeedback = [
  validateSubmitFormFeedbackParams,
  submitFormFeedback,
] as ControllerHandler[]
