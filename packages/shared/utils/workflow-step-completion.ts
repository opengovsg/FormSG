import { BasicField, FormFieldDto } from '../types/field'
import { FormStatus, FormWorkflowStep, WorkflowType } from '../types/form'

import { checkIsOptionsMismatched } from './options-recipients-map-validation'

/**
 * Only a live form needs a runnable workflow. Deliberately not gated on the
 * redesign flag; see PR #9856.
 */
export const mustWorkflowBeComplete = ({
  formStatus,
}: {
  formStatus?: FormStatus
}): boolean => formStatus === FormStatus.Public

// Every option of the selected dropdown needs at least one recipient, or a real submission routes nowhere.
const isConditionalRoutingComplete = (
  // Optional at runtime on a half-built step, though the type says otherwise.
  conditionalFieldId: FormFieldDto['_id'] | undefined,
  formFields: FormFieldDto[],
): boolean => {
  if (!conditionalFieldId) return false

  const conditionalField = formFields.find(
    (field) => String(field._id) === String(conditionalFieldId),
  )
  // Deleting a field leaves an orphaned reference behind, with no cascade.
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

/**
 * Whether a workflow step is complete enough to run. Needs a person, not fields;
 * step 0 is exempt. Ids are compared as strings since Mongoose hands back ObjectIds.
 *
 * @param stepNumber the step's position in the full, unfiltered workflow
 */
export const isStepComplete = (
  step: FormWorkflowStep,
  formFields: FormFieldDto[],
  stepNumber: number,
): boolean => {
  // An approval field the assigned person cannot see stalls the workflow permanently.
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

// The indices of every incomplete step in a workflow, in order; used to name the offending steps to the admin.
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
