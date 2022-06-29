import { celebrate, Joi, Segments } from 'celebrate'

import {
  FormAuthType,
  FormStatus,
  SettingsUpdateDto,
} from '../../../../../shared/types'

/**
 * Joi validator for PATCH /forms/:formId/settings route.
 */
export const updateSettingsValidator = celebrate({
  [Segments.BODY]: Joi.object<SettingsUpdateDto>({
    authType: Joi.string().valid(...Object.values(FormAuthType)),
    emails: Joi.alternatives().try(
      Joi.array().items(Joi.string().email()),
      Joi.string().email({ multiple: true }),
    ),
    esrvcId: Joi.string().allow(''),
    hasCaptcha: Joi.boolean(),
    inactiveMessage: Joi.string(),
    status: Joi.string().valid(...Object.values(FormStatus)),
    submissionLimit: Joi.number().allow(null),
    title: Joi.string(),
    webhook: Joi.object({
      url: Joi.string().uri().allow(''),
      isRetryEnabled: Joi.boolean(),
    }).min(1),
    endPage: Joi.object({
      title: Joi.string(),
      paragraph: Joi.string().allow(''),
      buttonLink: Joi.string().uri().allow(''),
      buttonText: Joi.string(),
    }).min(1),
  }).min(1),
})
