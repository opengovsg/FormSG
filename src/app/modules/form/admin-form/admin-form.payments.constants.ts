import { Joi } from 'celebrate'

import { paymentConfig } from '../../../config/features/payment.config'

const JoiInt = Joi.number().integer()
export const JoiPaymentProduct = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string().required(),
  multi_qty: Joi.boolean().required(),
  min_qty: Joi.when('multi_qty', {
    is: Joi.equal(true),
    then: JoiInt.positive().required(),
  }),
  max_qty: Joi.when('multi_qty', {
    is: Joi.equal(true),
    then: JoiInt.positive().required(),
  }),
  amount_cents: JoiInt.min(paymentConfig.minPaymentAmountCents)
    .max(paymentConfig.maxPaymentAmountCents)
    .required(),
  _id: Joi.string(),
})
