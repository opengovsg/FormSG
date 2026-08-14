import { BasicField, FormFieldDto } from '../types/field'
import { FormWorkflowStep, WorkflowType } from '../types/form'

import { checkIsOptionsMismatched } from './options-recipients-map-validation'

/**
 * Conditional routing is only usable once every option of the selected dropdown
 * has at least one recipient. An unmapped option means a real submission routes
 * nowhere, which is the failure the publish gate exists to prevent.
 *
 * The mapping lives on the dropdown field rather than on the workflow step, so
 * this needs the form's fields. See the note in `types/field/dropdownField.ts`.
 */
const isConditionalRoutingComplete = (
  // Typed as required on the step, but P12 loosens the schema so it can be
  // absent at runtime on a half-built step.
  conditionalFieldId: FormFieldDto['_id'] | undefined,
  formFields: FormFieldDto[],
): boolean => {
  if (!conditionalFieldId) return false

  const conditionalField = formFields.find(
    (field) => String(field._id) === String(conditionalFieldId),
  )
  // A deleted field leaves an orphaned reference behind, with no cascade to
  // clean it up. Such a step cannot route, so it is not complete.
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
 * Whether a workflow step is complete enough to run.
 *
 * A step needs fields to fill in, and a person to fill them in. The first step
 * is the exception on the second count only: its respondent is always "anyone
 * who has access to your form", stored as a Static step with an empty `emails`
 * array, so there is no person to configure. It is **not** exempt from needing
 * fields — the `edit` check below deliberately runs before that exemption.
 *
 * `stepNumber` must be the step's position in the full, unfiltered workflow.
 *
 * Field ids are compared as strings throughout: the frontend holds them as
 * strings and Mongoose hands them over as ObjectIds, where `===` compares
 * object identity and would never match.
 *
 * @param step the workflow step to check
 * @param formFields the form's fields, needed for conditional routing mappings
 * @param stepNumber the step's position in the full workflow
 */
export const isStepComplete = (
  step: FormWorkflowStep,
  formFields: FormFieldDto[],
  stepNumber: number,
): boolean => {
  if (step.edit.length === 0) return false

  // An approval field the assigned person cannot see leaves them nothing to
  // answer, and the workflow stops at their step permanently.
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

/**
 * The indices of every incomplete step in a workflow, in order. Callers use
 * these to name the offending steps to the admin.
 */
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
