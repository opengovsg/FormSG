import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import * as VerificationController from './verification.controller'

export const VfnRouter = Router()

const formatOfId = Joi.string().length(24).hex().required()

VfnRouter.post(
  '/',
  celebrate({
    [Segments.BODY]: Joi.object({
      formId: formatOfId,
    }),
  }),
  VerificationController.handleCreateTransaction,
)

VfnRouter.get(
  '/:transactionId',
  celebrate({
    [Segments.PARAMS]: Joi.object({
      transactionId: formatOfId,
    }),
  }),
  VerificationController.handleGetTransactionMetadata,
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
  VerificationController.handleResetField,
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
  VerificationController.handleGetOtp,
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
  VerificationController.handleVerifyOtp,
)
