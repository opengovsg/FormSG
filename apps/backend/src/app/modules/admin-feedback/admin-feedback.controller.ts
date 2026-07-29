import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import {
  ADMIN_FEEDBACK_TRIGGER_SOURCES,
  AdminCsatScore,
  ErrorDto,
} from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'

import { IAdminFeedbackSchema } from 'src/types'

import { statsdClient } from '../../config/datadog-statsd-client'
import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'

import * as AdminFeedbackService from './admin-feedback.service'
import { mapRouteError } from './admin-feedback.util'

const logger = createLoggerWithLabel(module)

const validateSubmitAdminFeedbackParams = celebrate({
  [Segments.BODY]: Joi.object()
    .keys({
      // Legacy thumbs (0/1). Remove once the star UI fully replaces it.
      rating: Joi.number().integer().min(0).max(1),
      csat: Joi.number().integer().min(1).max(5),
      comment: Joi.string(),
      triggerSource: Joi.string()
        .valid(...ADMIN_FEEDBACK_TRIGGER_SOURCES)
        .optional(),
      formId: Joi.string().hex().length(24).optional(),
    })
    // Exactly one scale per submission. Never translate between them.
    .xor('rating', 'csat'),
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
  {
    rating?: number
    csat?: AdminCsatScore
    comment?: string
    triggerSource?: string
    formId?: string
  }
> = async (req, res) => {
  const sessionUserId = (req.session as AuthedSessionData).user._id
  const { rating, csat, comment, triggerSource, formId } = req.body
  const sourceTag: Record<string, string> = triggerSource
    ? { triggerSource }
    : {}

  // Separate keys, separate metrics. The two scales can no longer pollute each
  // other, which is what #9763's flag gate was working around. The `.xor` in the
  // validator guarantees exactly one of `csat` / `rating` is present.
  if (csat !== undefined) {
    statsdClient.distribution('formsg.users.feedback.csat', csat, 1, {
      ...sourceTag,
      csat: `${csat}`,
    })
  } else if (rating !== undefined) {
    statsdClient.distribution('formsg.users.feedback.rating', rating, 1, {
      ...sourceTag,
      rating: `${rating}`,
    })
  }

  return AdminFeedbackService.insertAdminFeedback({
    userId: sessionUserId,
    rating,
    csat,
    comment,
    triggerSource,
    formId,
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
  validateSubmitAdminFeedbackParams,
  submitAdminFeedback,
] as ControllerHandler[]

const validateUpdateAdminFormFeedback = celebrate({
  [Segments.BODY]: Joi.object()
    .keys({
      rating: Joi.number().integer().min(0).max(1),
      csat: Joi.number().integer().min(1).max(5),
      comment: Joi.string(),
    })
    // At least one field, so an empty body 400s instead of a silent no-op.
    .min(1),
})

const updateAdminFeedback: ControllerHandler<
  { feedbackId: string },
  { message: string } | ErrorDto,
  { rating?: number; csat?: AdminCsatScore; comment?: string }
> = async (req, res) => {
  const { feedbackId } = req.params
  const sessionUserId = (req.session as AuthedSessionData).user._id

  const { rating, csat, comment } = req.body

  return AdminFeedbackService.updateAdminFeedback({
    feedbackId,
    userId: sessionUserId,
    comment,
    rating,
    csat,
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
