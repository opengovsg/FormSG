import { BasicField, FormFieldDto } from '../types/field'
import { FormStatus, FormWorkflowStep, WorkflowType } from '../types/form'

import { checkIsOptionsMismatched } from './options-recipients-map-validation'

/**
 * Whether a workflow has to be complete before it may be saved.
 *
 * Only a live form needs a runnable workflow. Building one is not linear: an
 * admin often knows which fields a step needs before they know who fills them
 * in, and a form nobody can submit to is safe to leave half-built.
 *
 * Deliberately does **not** consult the redesign flag. An earlier version made
 * flag-off strict for every status, reasoning that a rollback should not leave
 * a live form unguarded. But this ticket is what introduced the check at all:
 * before it, no layer required a Static step to have a recipient. Applying the
 * new rule to Private forms under flag-off would therefore reject workflow
 * mutations on forms that saved legally, and since the guard checks the whole
 * resulting workflow, a form with two such steps could not be repaired at all.
 * Gating on `Public` keeps live forms guarded in both flag states, which was
 * the actual concern.
 *
 * An unknown status is treated as not-live. The server always knows the status;
 * on the client this only defers to the server's answer on save.
 */
export const mustWorkflowBeComplete = ({
  formStatus,
}: {
  formStatus?: FormStatus
}): boolean => formStatus === FormStatus.Public

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
