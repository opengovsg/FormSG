import { celebrate, Joi } from 'celebrate'
import { Router } from 'express'

import verifiedFieldsFactory from './verification.factory'

const VfnRouter = Router()

const formatOfId = Joi.string().length(24).hex().required()

VfnRouter.post(
  '/',
  celebrate({
    body: Joi.object({
      formId: formatOfId,
    }),
  }),
  verifiedFieldsFactory.createTransaction,
)

VfnRouter.get(
  '/:transactionId',
  celebrate({
    params: Joi.object({
      transactionId: formatOfId,
    }),
  }),
  verifiedFieldsFactory.getTransactionMetadata,
)

VfnRouter.post(
  '/:transactionId/reset',
  celebrate({
    params: Joi.object({
      transactionId: formatOfId,
    }),
    body: Joi.object({
      fieldId: formatOfId,
    }),
  }),
  verifiedFieldsFactory.resetFieldInTransaction,
)

VfnRouter.post(
  '/:transactionId/otp',
  celebrate({
    params: Joi.object({
      transactionId: formatOfId,
    }),
    body: Joi.object({
      fieldId: formatOfId,
      answer: Joi.string().required(),
    }),
  }),
  verifiedFieldsFactory.getNewOtp,
)

VfnRouter.post(
  '/:transactionId/otp/verify',
  celebrate({
    params: Joi.object({
      transactionId: formatOfId,
    }),
    body: Joi.object({
      fieldId: formatOfId,
      otp: Joi.string()
        .regex(/^\d{6}$/)
        .required()
        .error(() => 'Please enter a valid otp'),
    }),
  }),
  verifiedFieldsFactory.verifyOtp,
)

export { VfnRouter }
