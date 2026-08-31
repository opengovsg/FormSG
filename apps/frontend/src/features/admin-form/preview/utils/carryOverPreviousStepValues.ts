import { FormFieldDto, StrippedFormWorkflowStepDto } from 'formsg-shared/types'

import { FormFieldValues } from '~templates/Field'

/**
 * Builds the form values to show after a preview step switch.
 *
 * A respondent at a workflow step sees the answers earlier steps submitted, and
 * nothing from the steps after theirs. The preview has no submission to draw
 * those answers from, so the answers already entered stand in for them: a field
 * some earlier step could edit keeps its entered value, and every other field
 * falls back to its default.
 *
 * The test is "did an earlier step fill this in", not "can this step edit it".
 * The two agree while moving forwards through the workflow and diverge on the
 * way back: a value typed at step 3 is uneditable at step 1, but a step 1
 * respondent has never seen it, so it must not appear.
 *
 * This matters beyond appearances, because conditional logic is evaluated
 * against these values. Getting them wrong lets the preview show a field set
 * the real respondent would never be given.
 */
export const carryOverPreviousStepValues = ({
  augmentedFormFields,
  precedingWorkflowSteps,
  enteredValues,
  defaultFormValues,
}: {
  augmentedFormFields: FormFieldDto[]
  precedingWorkflowSteps: StrippedFormWorkflowStepDto[]
  enteredValues: FormFieldValues
  defaultFormValues: FormFieldValues
}): FormFieldValues => {
  const filledByAnEarlierStep = new Set(
    precedingWorkflowSteps.flatMap((step) => step.edit),
  )

  const carriedOverValues = augmentedFormFields.reduce<FormFieldValues>(
    (acc, field) => {
      if (
        filledByAnEarlierStep.has(field._id) &&
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
