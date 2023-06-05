import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import { rateLimitConfig } from '../../config/config'
import { limitRate } from '../../utils/limit-rate'

import * as VerificationController from './verification.controller'

/** @deprecated use PublicFormsVerificationRouter in src/app/routes/api/v3/forms/public-forms.verification.routes.ts instead. */
export const VfnRouter = Router()

const formatOfId = Joi.string().length(24).hex().required()

/**
 * Route for POST /transaction
 * @body {formId: string}: The form to create the transaction for
 * @deprecated in favour of POST /forms/:formId/fieldverifications
 */
VfnRouter.post(
  '/',
  limitRate({ max: rateLimitConfig.submissions }),
  celebrate({
    [Segments.BODY]: Joi.object({
      formId: formatOfId,
    }),
  }),
  VerificationController.handleCreateTransaction,
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
  VerificationController.handleResetField,
)

/**
 * @deprecated in favour of POST /forms/:formId/fieldverifications/:transactionId/fields/:fieldId/otp/generate
 */
VfnRouter.post(
  '/:transactionId([a-fA-F0-9]{24})/otp',
  limitRate({ max: rateLimitConfig.sendAuthOtp }),
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

/**
 * @deprecated in favour of POST /forms/:formId/fieldverifications/:transactionId/fields/:fieldId/otp/verify
 */
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
  VerificationController.handleVerifyOtp,
)
