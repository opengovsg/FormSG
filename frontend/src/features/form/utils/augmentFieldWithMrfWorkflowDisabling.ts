import { FormFieldDto, StrippedFormWorkflowStepDto } from '~shared/types'

import { NON_RESPONSE_FIELD_SET } from '../constants'

export const isFieldEnabledByMrfWorkflow = (
  workflowStep: StrippedFormWorkflowStepDto | undefined,
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

/**
 * Disables fields based on if the field is editable in the current workflow step
 * @param workflowStep The current workflow step
 * @param field The field to check if it is editable in the current workflow step
 * @returns The field with the disabled property set based on the workflow step and its previous disabled state
 */
export const augmentFieldWithMrfWorkflowDisabling = (
  workflowStep: StrippedFormWorkflowStepDto | undefined,
  field: FormFieldDto,
) => ({
  ...field,
  disabled: field.disabled || !isFieldEnabledByMrfWorkflow(workflowStep, field),
})
