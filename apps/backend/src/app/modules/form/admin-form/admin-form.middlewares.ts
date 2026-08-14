import { celebrate, Joi, Segments } from 'celebrate'
import {
  FormAuthType,
  FormStatus,
  Language,
  SettingsUpdateDto,
  WebhookSettingsUpdateDto,
  WorkflowType,
} from 'formsg-shared/types'

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
    stepsToNotify: Joi.array().items(Joi.string()),
    stepOneEmailNotificationFieldId: Joi.string().allow(''),
    esrvcId: Joi.string().allow(''),
    isSaveDraftEnabled: Joi.boolean(),
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
    hasMultiLang: Joi.boolean(),
    supportedLanguages: Joi.array().items(
      Joi.string().valid(...Object.values(Language)),
    ),
    hasRespondentCopy: Joi.boolean(),
    hasStatusTracker: Joi.boolean(),
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

/**
 * Body shape for POST /forms/:formId/workflow/.
 *
 * FRM-2489: this validates **format and shape only**. Whether a step is
 * complete enough is decided in the service layer, which knows the form's
 * status — incomplete is permitted on a Private form and rejected on a Public
 * one, a distinction Joi cannot make from the request body alone.
 *
 * `field` and `conditional_field` must therefore be *omitted* rather than sent
 * empty when the admin has not chosen one. `Joi.string()` rejects `''`, and an
 * empty string would fail to cast to an ObjectId further down anyway.
 *
 * Exported separately from the `celebrate` wrapper so it can be unit tested.
 */
export const createWorkflowStepBodyValidator = Joi.object({
  workflow_type: Joi.string().valid(...Object.values(WorkflowType)),
  emails: Joi.when('workflow_type', {
    is: WorkflowType.Static,
    // Requires the key, not a non-empty array: `[]` passes, and always has.
    then: Joi.array().items(Joi.string().email()).required(),
  }),
  field: Joi.when('workflow_type', {
    is: WorkflowType.Dynamic,
    then: Joi.string().optional(),
  }),
  edit: Joi.array().items(Joi.string()).required(),
  approval_field: Joi.string().optional(),
  conditional_field: Joi.when('workflow_type', {
    is: WorkflowType.Conditional,
    then: Joi.string().optional(),
    otherwise: Joi.forbidden(),
  }),
  step_name: Joi.string().optional(),
})

/**
 * Joi validator for POST /forms/:formId/workflow/ route.
 */
export const createWorkflowStepValidator = celebrate({
  [Segments.BODY]: createWorkflowStepBodyValidator,
  [Segments.PARAMS]: Joi.object({
    formId: Joi.string().required(),
  }),
})

/**
 * Body shape for PUT /forms/:formId/workflow/:stepNumber.
 * See `createWorkflowStepBodyValidator` for why completeness is not checked
 * here.
 */
export const updateWorkflowStepBodyValidator = Joi.object({
  _id: Joi.string().required(),
  workflow_type: Joi.string().valid(...Object.values(WorkflowType)),
  emails: Joi.when('workflow_type', {
    is: WorkflowType.Static,
    then: Joi.array().items(Joi.string().email()).required(),
  }),
  field: Joi.when('workflow_type', {
    is: WorkflowType.Dynamic,
    then: Joi.string().optional(),
  }),
  edit: Joi.array().items(Joi.string().hex().length(24)).required(),
  approval_field: Joi.string().optional(),
  conditional_field: Joi.when('workflow_type', {
    is: WorkflowType.Conditional,
    then: Joi.string().optional(),
    otherwise: Joi.forbidden(),
  }),
  step_name: Joi.string().optional(),
})

/**
 * Joi validator for PUT /forms/:formId/workflow/:stepNumber route.
 */
export const updateWorkflowStepValidator = celebrate({
  [Segments.BODY]: updateWorkflowStepBodyValidator,
  [Segments.PARAMS]: Joi.object({
    formId: Joi.string().required(),
    stepNumber: Joi.number().integer().min(0).required(),
  }),
})
