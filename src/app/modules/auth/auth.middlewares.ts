import { celebrate, Joi, Segments } from 'celebrate'
import { AuthedSessionData } from 'express-session'
import { StatusCodes } from 'http-status-codes'

import { createLoggerWithLabel } from '../../config/logger'
import { createReqMeta } from '../../utils/request'
import { ControllerHandler } from '../core/core.types'

import { isCronPaymentAuthValid, isUserInSession } from './auth.utils'

const logger = createLoggerWithLabel(module)

/**
 * Middleware that only allows authenticated users to pass through to the next
 * handler.
 * @returns next if user exists in session
 * @returns 401 if user does not exist in session
 */
export const withUserAuthentication: ControllerHandler = (req, res, next) => {
  if (isUserInSession(req.session)) {
    return next()
  }

  return res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ message: 'User is unauthorized.' })
}

/**
 * Logs all admin actions which change database state (i.e. non-GET requests)
 * @returns next
 */
export const logAdminAction: ControllerHandler<{ formId: string }> = async (
  req,
  res,
  next,
) => {
  const sessionUserId = (req.session as AuthedSessionData).user._id
  const body = req.body
  const method = req.method
  const query = req.query
  const { formId } = req.params

  if (req.method.toLowerCase() !== 'get') {
    logger.info({
      message: 'Admin attempting to make changes',
      meta: {
        action: 'logAdminAction',
        method,
        ...createReqMeta(req),
        sessionUserId,
        formId,
        query,
        body,
      },
    })
  }

  return next()
}

export const validateCheckUserParams = celebrate({
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string()
      .required()
      .email()
      .message('Please enter a valid email')
      .lowercase(),
  }),
})

export const validateLoginSendOtpParams = celebrate({
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string()
      .required()
      .email()
      .message('Please enter a valid email')
      .lowercase(),
  }),
})

export const validateVerifyOtpParams = celebrate({
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string()
      .required()
      .email()
      .message('Please enter a valid email')
      .lowercase(),
    otp: Joi.string()
      .required()
      .regex(/^\d{6}$/)
      .message('Please enter a valid OTP'),
  }),
})

export const withCronPaymentSecretAuthentication: ControllerHandler = (
  req,
  res,
  next,
) => {
  if (isCronPaymentAuthValid(req.headers)) {
    return next()
  }

  return res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ message: 'Request is unauthorized.' })
}
