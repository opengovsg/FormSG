import { celebrate, Joi, Segments } from 'celebrate'

export const validateGenerateRedirectParams = celebrate({
  [Segments.QUERY]: {
    redirectPath: Joi.string()
      .regex(/^[a-fA-F0-9]{24}(\/(preview|template|use-template))?/)
      .required(),
  },
})
