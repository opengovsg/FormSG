import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { AdminCsatScore, ErrorDto } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'

import { IAdminFeedbackSchema } from 'src/types'

import { statsdClient } from '../../config/datadog-statsd-client'
import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'

import * as AdminFeedbackService from './admin-feedback.service'
import { mapRouteError } from './admin-feedback.util'

const logger = createLoggerWithLabel(module)

const valdiateSubmitAdminFeedbackParams = celebrate({
  [Segments.BODY]: Joi.object()
    .keys({
      // Legacy thumbs (0/1). Still sent by the live UI on develop; remove once
      // the star rating UI fully replaces it.
      rating: Joi.number().integer().min(0).max(1),
      // The new 1-5 CSAT measure, on its own key.
      csat: Joi.number().integer().min(1).max(5),
      comment: Joi.string(),
      triggerSource: Joi.string()
        .valid('field-edit', 'publish', 'workflow')
        .optional(),
      formId: Joi.string().optional(),
    })
    // Exactly one of the two scales. Never translate between them.
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

  // Separate keys, separate metrics. The scales can no longer pollute each
  // other, which is the problem #9763's feature-flag gate was working around,
  // so that gate is no longer needed here.
  //
  // Note vs #9795: that PR dropped the `.rating` emit because the transitional
  // code pushed 1-5 values into a metric whose history is 0/1 thumbs. The xor
  // contract makes that impossible by construction, so `.rating` is kept and
  // now only ever receives genuine thumbs from the still-live legacy UI.
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

  // Each scale is stored under its own key. Never translated between them.
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
  valdiateSubmitAdminFeedbackParams,
  submitAdminFeedback,
] as ControllerHandler[]

const validateUpdateAdminFormFeedback = celebrate({
  [Segments.BODY]: Joi.object()
    .keys({
      // Legacy thumbs (0/1).
      rating: Joi.number().integer().min(0).max(1),
      csat: Joi.number().integer().min(1).max(5),
      comment: Joi.string(),
    })
    // At most one scale. A comment-only edit stays valid, but a single row can
    // never carry both scales.
    .oxor('rating', 'csat'),
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
