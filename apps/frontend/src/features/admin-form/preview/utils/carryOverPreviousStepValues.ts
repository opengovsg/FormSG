import { FormFieldDto, StrippedFormWorkflowStepDto } from 'formsg-shared/types'

import { FormFieldValues } from '~templates/Field'

import { isFieldEnabledByMrfWorkflow } from '~features/form/utils/augmentFieldWithMrfWorkflowDisabling'

/**
 * Builds the form values to show after a preview step switch.
 *
 * A respondent at a workflow step sees the earlier steps' submitted answers
 * filled in and read-only, and their own fields untouched. The preview has no
 * submission to draw those answers from, so the answers already entered stand
 * in for them: a field this step cannot edit keeps its entered value, and every
 * field this step can edit falls back to its default.
 *
 * Carrying them over matters beyond appearances, because conditional logic is
 * evaluated against these values. Resetting every field would let the preview
 * show a field set the real respondent would never be given.
 */
export const carryOverPreviousStepValues = ({
  augmentedFormFields,
  currentStepNumberWorkflowStep,
  enteredValues,
  defaultFormValues,
}: {
  augmentedFormFields: FormFieldDto[]
  currentStepNumberWorkflowStep: StrippedFormWorkflowStepDto | undefined
  enteredValues: FormFieldValues
  defaultFormValues: FormFieldValues
}): FormFieldValues => {
  const carriedOverValues = augmentedFormFields.reduce<FormFieldValues>(
    (acc, field) => {
      if (
        !isFieldEnabledByMrfWorkflow(currentStepNumberWorkflowStep, field) &&
        enteredValues[field._id] !== undefined
      ) {
        acc[field._id] = enteredValues[field._id]
      }
      return acc
    },
    {},
  )
  return { ...defaultFormValues, ...carriedOverValues }
}
