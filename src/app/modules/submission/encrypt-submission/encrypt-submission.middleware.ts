import { celebrate, Joi, Segments } from 'celebrate'

import { BasicField } from '../../../../../shared/types'
import { paymentConfig } from '../../../config/features/payment.config'
import { sharedSubmissionParams } from '../submission.constants'

/**
 * Celebrate middleware for verifying shape of encrypted submission
 */
export const validateEncryptSubmissionParams = celebrate({
  [Segments.BODY]: Joi.object({
    ...sharedSubmissionParams,
    version: Joi.number().required(),
  }),
})

/**
 * Celebrate middleware for verifying shape of encrypted submission
 */
export const validateStorageSubmissionParams = celebrate({
  [Segments.BODY]: Joi.object({
    responses: Joi.array()
      .items(
        Joi.object()
          .keys({
            _id: Joi.string().required(),
            question: Joi.string(),
            fieldType: Joi.string()
              .required()
              .valid(...Object.values(BasicField)),
            answer: Joi.string().allow(''),
            answerArray: Joi.array(),
            filename: Joi.string(),
            content: Joi.binary(),
            isHeader: Joi.boolean(),
            myInfo: Joi.object(),
            signature: Joi.string().allow(''),
          })
          .xor('answer', 'answerArray') // only answer or answerArray can be present at once
          .with('filename', 'content'), // if filename is present, content must be present
      )
      .required(),
    paymentReceiptEmail: Joi.string(),
    payments: Joi.object({
      amount_cents: Joi.number()
        .integer()
        .positive()
        .min(paymentConfig.minPaymentAmountCents)
        .max(paymentConfig.maxPaymentAmountCents),
    }),
    version: Joi.number().required(),
    responseMetadata: Joi.object({
      responseTimeMs: Joi.number(),
      numVisibleFields: Joi.number(),
    }),
  }),
})
