import { BasicField, FormFieldDto } from '../types/field'
import { FormStatus, FormWorkflowStep, WorkflowType } from '../types/form'

import { checkIsOptionsMismatched } from './options-recipients-map-validation'

/**
 * Whether a workflow has to be complete before it may be saved.
 *
 * Building a workflow is not linear: an admin often knows which fields a step
 * needs before they know who fills them in. Only a `Private` form may hold a
 * half-built step, since nobody can submit to it mid-build.
 *
 * Lives here, next to the predicate it gates, so the client and the server
 * cannot state the same policy two different ways. Anything other than
 * `Private` is strict, including an unknown status, so a form that has not
 * loaded yet fails safe.
 */
export const mustWorkflowBeComplete = ({
  formStatus,
  isRedesignEnabled,
}: {
  formStatus?: FormStatus
  isRedesignEnabled: boolean
}): boolean => !isRedesignEnabled || formStatus !== FormStatus.Private

/**
 * Conditional routing is only usable once every option of the selected dropdown
 * has at least one recipient, otherwise a real submission routes nowhere. The
 * mapping lives on the dropdown field, so this needs the form's fields.
 */
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
 * Whether a workflow step is complete enough to run.
 *
 * A step needs a person to fill it in, but not fields to fill: a respondent who
 * only reads the submission and passes it on is legitimate, and live forms do
 * this. Step 0 is exempt from needing a person, since its respondent is always
 * whoever opens the form.
 *
 * Ids are compared as strings: the frontend holds them as strings and Mongoose
 * hands them over as ObjectIds, where `===` compares identity and never matches.
 *
 * @param stepNumber the step's position in the full, unfiltered workflow
 */
export const isStepComplete = (
  step: FormWorkflowStep,
  formFields: FormFieldDto[],
  stepNumber: number,
): boolean => {
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
