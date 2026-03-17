import { celebrate, Joi, Segments } from 'celebrate'

export const validateGetBillingInfoParams = celebrate({
  [Segments.QUERY]: Joi.object({
    esrvcId: Joi.string().required(),
    yr: Joi.number().integer().min(2019).required(),
    mth: Joi.number().integer().min(0).max(11).required(),
  }),
})
