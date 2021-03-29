import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import * as VerificationController from './verification.controller'
import { verificationMiddleware } from './verification.middleware'

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
  '/:transactionId([a-fA-F0-9]{24})',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      transactionId: formatOfId,
    }),
  }),
  VerificationController.handleGetTransactionMetadata,
)

VfnRouter.post(
  '/:transactionId([a-fA-F0-9]{24})/reset',
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
  '/:transactionId([a-fA-F0-9]{24})/otp',
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
  '/:transactionId([a-fA-F0-9]{24})/otp/verify',
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
