import { celebrate, Joi, Segments } from 'celebrate'

import {
  FormAuthType,
  FormStatus,
  SettingsUpdateDto,
  WebhookSettingsUpdateDto,
} from '../../../../../shared/types'

import { verifyValidUnicodeString } from './admin-form.utils'

const webhookSettingsValidator = Joi.object({
  url: Joi.string().uri().allow(''),
  isRetryEnabled: Joi.boolean(),
}).min(1)

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
    hasIssueNotification: Joi.boolean(),
    inactiveMessage: Joi.string(),
    status: Joi.string().valid(...Object.values(FormStatus)),
    submissionLimit: Joi.number().allow(null),
    title: Joi.string(),
    webhook: webhookSettingsValidator,
    business: Joi.object({
      address: Joi.string().allow(''),
      gstRegNo: Joi.string().allow(''),
    }),
    payments_field: Joi.object({ gst_enabled: Joi.boolean() }),
  })
    .min(1)
    .custom((value, helpers) => verifyValidUnicodeString(value, helpers)),
})

/**
 * Joi validator for PATCH api/platform/v1/admin/forms/:formId/webhookSettings route.
 */
export const updateWebhookSettingsValidator = celebrate({
  [Segments.BODY]: Joi.object<WebhookSettingsUpdateDto>({
    userEmail: Joi.string(),
    webhook: webhookSettingsValidator,
  }),
})
