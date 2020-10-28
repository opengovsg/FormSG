import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import { PrivateFormError } from '../form.errors'
import { isFormPublic, retrieveFullFormById } from '../form.service'

import { insertFormFeedback } from './public-form.service'
import { mapRouteError } from './public-form.utils'

const logger = createLoggerWithLabel(module)

export const handleSubmitFeedback: RequestHandler<
  { formId: string },
  unknown,
  { rating: number; comment: string }
> = async (req, res) => {
  const { formId } = req.params
  const { rating, comment } = req.body

  const formResult = await retrieveFullFormById(formId)

  if (formResult.isErr()) {
    const { error } = formResult
    logger.error({
      message: 'Failed to retrieve form',
      meta: {
        action: 'handleSubmitFeedback',
        ...createReqMeta(req),
        formId,
      },
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  const form = formResult.value

  // Handle form status states.
  const isPublicResult = isFormPublic(form)
  if (isPublicResult.isErr()) {
    const { error } = isPublicResult
    logger.warn({
      message: 'Form is not public',
      meta: {
        action: 'handleSubmitFeedback',
        ...createReqMeta(req),
        formId,
      },
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)

    // Specialized error response for PrivateFormError.
    if (error instanceof PrivateFormError) {
      return res.status(statusCode).json({
        message: form.inactiveMessage,
        // Flag to prevent default 404 subtext ("please check link") from
        // showing.
        isPageFound: true,
        formTitle: form.title,
      })
    }
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Form is valid, proceed to next step.
  const submitFeedbackResult = await insertFormFeedback({
    formId: form._id,
    rating,
    comment,
  })

  if (submitFeedbackResult.isErr()) {
    const { error } = submitFeedbackResult
    logger.error({
      message: 'Error creating form feedback',
      meta: {
        action: 'handleSubmitFeedback',
        ...createReqMeta(req),
        formId,
      },
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Success.
  return res
    .status(StatusCodes.OK)
    .json({ message: 'Successfully submitted feedback' })
}
