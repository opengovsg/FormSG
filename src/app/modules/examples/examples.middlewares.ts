import { celebrate, Joi, Segments } from 'celebrate'

export const validateGetExamplesParams = celebrate({
  [Segments.QUERY]: Joi.object().keys({
    pageNo: Joi.number().min(0).required(),
    agency: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .allow(''),
    searchTerm: Joi.string().allow(''),
    shouldGetTotalNumResults: Joi.boolean().default(false),
  }),
})
