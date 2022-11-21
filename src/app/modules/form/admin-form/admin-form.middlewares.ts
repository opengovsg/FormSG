import { celebrate, Joi, Segments } from 'celebrate'

import {
  FormAuthType,
  FormStatus,
  SettingsUpdateDto,
} from '../../../../../shared/types'
import { UNICODE_ESCAPED_REGEX } from '../form.utils'

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
  })
    .min(1)
    .custom((value, helpers) => {
      // If there are invalid utf-8 encoded unicode-escaped characters,
      // node 14 treats the sequence of characters as a string e.g. \udbbb is treated as a 6-character string instead of an escaped unicode sequence
      // If this is saved into the db, an error is thrown when the driver attempts to read the db document as the driver interprets this as an escaped unicode sequence.
      // Since valid unicode-escaped characters will be processed correctly (e.g. \u00ae is processed as ®), they will not trigger an error
      // Also note that if the user intends to input a 6-character string of the same form e.g. \udbbb, the backslash will be escaped (i.e. double backslash) and hence this will also not trigger an error

      const valueStr = JSON.stringify(value)

      if (UNICODE_ESCAPED_REGEX.test(valueStr)) {
        return helpers.message({
          custom: 'There are invalid characters in your input',
        })
      }
      return value
    }),
})
