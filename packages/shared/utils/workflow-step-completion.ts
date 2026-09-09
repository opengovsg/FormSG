import { BasicField, FormFieldDto } from '../types/field'
import { FormStatus, FormWorkflowStep, WorkflowType } from '../types/form'

import { checkIsOptionsMismatched } from './options-recipients-map-validation'

export const mustWorkflowBeComplete = ({
  formStatus,
}: {
  formStatus?: FormStatus
}): boolean => formStatus === FormStatus.Public

const isConditionalRoutingComplete = (
  conditionalFieldId: FormFieldDto['_id'] | undefined,
  formFields: FormFieldDto[],
): boolean => {
  if (!conditionalFieldId) return false

  const conditionalField = formFields.find(
    (field) => String(field._id) === String(conditionalFieldId),
  )
  if (!conditionalField || conditionalField.fieldType !== BasicField.Dropdown) {
    return false
  }

  const optionsToRecipientsMap = conditionalField.optionsToRecipientsMap ?? {}
  if (
    checkIsOptionsMismatched(
      Object.keys(optionsToRecipientsMap),
      conditionalField.fieldOptions,
    )
  ) {
    return false
  }

  return conditionalField.fieldOptions.every(
    (option) => (optionsToRecipientsMap[option]?.length ?? 0) > 0,
  )
}

export const isStepComplete = (
  step: FormWorkflowStep,
  formFields: FormFieldDto[],
  stepNumber: number,
): boolean => {
  if (
    step.approval_field &&
    !step.edit.map(String).includes(String(step.approval_field))
  ) {
    return false
  }

  if (stepNumber === 0) return true

  switch (step.workflow_type) {
    case WorkflowType.Static:
      return step.emails.length > 0
    case WorkflowType.Dynamic:
      return !!step.field
    case WorkflowType.Conditional:
      return isConditionalRoutingComplete(step.conditional_field, formFields)
  }
}

export const getIncompleteStepNumbers = (
  workflow: FormWorkflowStep[],
  formFields: FormFieldDto[],
): number[] =>
  workflow.reduce<number[]>(
    (incomplete, step, stepNumber) =>
      isStepComplete(step, formFields, stepNumber)
        ? incomplete
        : [...incomplete, stepNumber],
    [],
  )
