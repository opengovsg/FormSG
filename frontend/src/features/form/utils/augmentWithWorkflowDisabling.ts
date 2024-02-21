import { FormFieldDto, FormWorkflowStep } from '~shared/types'

import { NON_RESPONSE_FIELD_SET } from '../constants'

export const isFieldEnabledByWorkflow = (
  workflowStep: FormWorkflowStep | undefined,
  field: FormFieldDto,
) => {
  // If no workflow, default to enabled
  if (!workflowStep) return true

  // There is a workflow, but enable if it's a non-response field
  if (NON_RESPONSE_FIELD_SET.has(field.fieldType)) return true

  // (By this point a workflow exists and it is a response field, so check if it
  // has been explicitly set to be editable in the workflow
  return workflowStep.edit.includes(field._id)
}

export const augmentWithWorkflowDisabling = (
  workflowStep: FormWorkflowStep | undefined,
  field: FormFieldDto,
) => ({
  ...field,
  disabled: field.disabled || !isFieldEnabledByWorkflow(workflowStep, field),
})
