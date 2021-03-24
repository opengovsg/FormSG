import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import { verificationMiddleware } from './verification.factory'

export const VfnRouter = Router()

const formatOfId = Joi.string().length(24).hex().required()

VfnRouter.post(
  '/',
  celebrate({
    [Segments.BODY]: Joi.object({
      formId: formatOfId,
    }),
  }),
  verificationMiddleware.createTransaction,
)

VfnRouter.get(
  '/:transactionId',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      transactionId: formatOfId,
    }),
  }),
  verificationMiddleware.getTransactionMetadata,
)

VfnRouter.post(
  '/:transactionId/reset',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      transactionId: formatOfId,
    }),
    [Segments.BODY]: Joi.object({
      fieldId: formatOfId,
    }),
  }),
  verificationMiddleware.resetFieldInTransaction,
)

VfnRouter.post(
  '/:transactionId/otp',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      transactionId: formatOfId,
    }),
    [Segments.BODY]: Joi.object({
      fieldId: formatOfId,
      answer: Joi.string().required(),
    }),
  }),
  verificationMiddleware.getNewOtp,
)

VfnRouter.post(
  '/:transactionId/otp/verify',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      transactionId: formatOfId,
    }),
    [Segments.BODY]: Joi.object({
      fieldId: formatOfId,
      otp: Joi.string()
        .required()
        .regex(/^\d{6}$/)
        .message('Please enter a valid OTP'),
    }),
  }),
  verificationMiddleware.verifyOtp,
)
