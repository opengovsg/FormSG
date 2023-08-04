import { Joi } from 'celebrate'
import { BasicField } from 'shared/types'

import { paymentConfig } from 'src/app/config/features/payment.config'

export const sharedSubmissionParams = {
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
  responseMetadata: Joi.object({
    responseTimeMs: Joi.number(),
    numVisibleFields: Joi.number(),
  }),
}
