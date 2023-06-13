import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { StatusCodes } from 'http-status-codes'
import { ErrorDto } from 'shared/types'

import { IAdminFeedbackSchema } from 'src/types'

import { statsdClient } from '../../config/datadog-statsd-client'
import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'

import * as AdminFeedbackService from './admin-feedback.service'
import { mapRouteError } from './admin-feedback.util'

const logger = createLoggerWithLabel(module)

const valdiateSubmitAdminFeedbackParams = celebrate({
  [Segments.BODY]: Joi.object().keys({
    rating: Joi.number().min(0).max(1).required(),
    comment: Joi.string(),
  }),
})

/**
 * Handler for POST api/v3/admin/forms/feedback
 * @precondition user should be logged in
 * @precondition Joi validation should enforce shape of req.body before this handler is invoked.
 * @security session
 *
 * @returns 200 if feedback was successfully saved
 * @returns 422 when user of given id cannnot be found in the database
 * @returns 500 if database error occurs
 */
const submitAdminFeedback: ControllerHandler<
  unknown,
  { message: string; feedback: IAdminFeedbackSchema } | ErrorDto,
  { rating: number; comment?: string }
> = async (req, res) => {
  const sessionUserId = (req.session as AuthedSessionData).user._id
  const { rating, comment } = req.body

  // send rating to DD
  statsdClient.distribution('formsg.users.feedback.rating', rating, 1, {
    rating: `${rating}`,
  })

  return AdminFeedbackService.insertAdminFeedback({
    userId: sessionUserId,
    rating,
    comment,
  })
    .map((adminFeedback) =>
      res.status(StatusCodes.OK).json({
        message: 'Successfully submitted admin feedback',
        feedback: adminFeedback,
      }),
    )
    .mapErr((error) => {
      const { errorMessage, statusCode } = mapRouteError(error)
      logger.error({
        message: 'Error while submitting admin feedback',
        meta: {
          action: 'submitAdminFeedback',
          ...createReqMeta(req),
          sessionUserId,
        },
        error,
      })

      return res.status(statusCode).json({ message: errorMessage })
    })
}

export const handleSubmitAdminFeedback = [
  valdiateSubmitAdminFeedbackParams,
  submitAdminFeedback,
] as ControllerHandler[]

const validateUpdateAdminFormFeedback = celebrate({
  [Segments.BODY]: Joi.object().keys({
    rating: Joi.number().min(0).max(1),
    comment: Joi.string(),
  }),
})

const updateAdminFeedback: ControllerHandler<
  { feedbackId: string },
  { message: string } | ErrorDto,
  { rating?: number; comment?: string }
> = async (req, res) => {
  const { feedbackId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id

  const { rating, comment } = req.body

  return AdminFeedbackService.updateAdminFeedback({
    feedbackId,
    userId: sessionUserId,
    comment,
    rating,
  })
    .map(() =>
      res
        .status(StatusCodes.OK)
        .json({ message: 'Successfully updated admin feedback' }),
    )
    .mapErr((error) => {
      const { errorMessage, statusCode } = mapRouteError(error)
      logger.error({
        message: 'Error while updating admin feedback',
        meta: {
          action: 'updateAdminFeedback',
          ...createReqMeta(req),
          feedbackId,
          sessionUserId,
        },
        error,
      })

      return res.status(statusCode).json({ message: errorMessage })
    })
}

export const handleUpdateAdminFeedback = [
  validateUpdateAdminFormFeedback,
  updateAdminFeedback,
] as ControllerHandler[]
