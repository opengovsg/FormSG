import { celebrate, Joi, Segments } from 'celebrate'

import {
  FormAuthType,
  FormStatus,
  SettingsUpdateDto,
  WebhookSettingsUpdateDto,
  WorkflowType,
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
    isSubmitterIdCollectionEnabled: Joi.boolean(),
    isSingleSubmission: Joi.boolean(),
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
    workflow: Joi.array()
      .items(
        Joi.object({
          _id: Joi.string(),
          workflow_type: Joi.string().valid(...Object.values(WorkflowType)),
          emails: Joi.when('workflow_type', {
            is: WorkflowType.Static,
            then: Joi.array().items(Joi.string().email()).required(),
          }),
          // TODO: Add regex validation that these are valid mongo IDs
          field: Joi.when('workflow_type', {
            is: WorkflowType.Dynamic,
            then: Joi.string().required(),
          }),
          edit: Joi.array().items(Joi.string()).required(),
        }),
      )
      .optional(),
  })
    .min(1)
    .custom((value, helpers) => verifyValidUnicodeString(value, helpers)),
})

/**
 * Joi validator for PATCH api/public/v1/admin/forms/:formId/webhooksettings route.
 */
export const updateWebhookSettingsValidator = celebrate({
  [Segments.BODY]: Joi.object<WebhookSettingsUpdateDto>({
    userEmail: Joi.string().email().optional(),
    webhook: webhookSettingsValidator,
  }),
})

/**
 * Joi validator for POST api/public/v1/admin/forms/:formId/webhooksettings route.
 */
export const getWebhookSettingsValidator = celebrate({
  [Segments.BODY]: Joi.object<{ userEmail: string }>({
    userEmail: Joi.string().email().optional(),
  }),
})
