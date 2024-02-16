import { FormFieldDto, FormWorkflowStep } from '~shared/types'

import { NON_RESPONSE_FIELD_SET } from '../constants'

export const isFieldEnabledByWorkflow = (
  workflowStep: FormWorkflowStep | undefined,
  field: FormFieldDto,
) =>
  // Field is enabled if:
  // 1. there is no workflow OR
  // 2. it is a non-response field OR
  // 3. (by this point it is workflow + response field) has been explicitly set to be editable in the workflow
  !workflowStep ||
  NON_RESPONSE_FIELD_SET.has(field.fieldType) ||
  workflowStep.edit.includes(field._id)

export const augmentWithWorkflowDisabling = (
  workflowStep: FormWorkflowStep | undefined,
  field: FormFieldDto,
) => ({
  ...field,
  disabled: field.disabled || !isFieldEnabledByWorkflow(workflowStep, field),
})
