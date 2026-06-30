import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { ErrorDto } from 'formsg-shared/types'
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
  [Segments.BODY]: Joi.object().keys({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string(),
    triggerSource: Joi.string()
      .valid('field-edit', 'publish', 'workflow')
      .optional(),
    formId: Joi.string().optional(),
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
  { rating: number; comment?: string; triggerSource?: string; formId?: string }
> = async (req, res) => {
  const sessionUserId = (req.session as AuthedSessionData).user._id
  const { rating, comment, triggerSource, formId } = req.body

  // Dual-emit: old metric kept so existing dashboards don't break during
  // migration. New metric (.v2) for the 1-5 scale. Remove the old metric
  // once report card has migrated to .v2.
  statsdClient.distribution('formsg.users.feedback.rating', rating, 1, {
    rating: `${rating}`,
    ...(triggerSource ? { triggerSource } : {}),
  })
  statsdClient.distribution('formsg.users.feedback.rating.v2', rating, 1, {
    rating: `${rating}`,
    ...(triggerSource ? { triggerSource } : {}),
  })

  return AdminFeedbackService.insertAdminFeedback({
    userId: sessionUserId,
    rating,
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
  [Segments.BODY]: Joi.object().keys({
    rating: Joi.number().integer().min(1).max(5),
    comment: Joi.string(),
  }),
})

// No Datadog metric here. Metric fires on create only to avoid double-counting
// when an admin changes their star rating.
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
