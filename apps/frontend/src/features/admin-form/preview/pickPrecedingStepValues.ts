import { StrippedFormWorkflowStepDto } from 'formsg-shared/types/form'

import { FormFieldValues } from '~templates/Field'

export const pickPrecedingStepValues = (
  precedingSteps: Pick<StrippedFormWorkflowStepDto, 'edit'>[],
  enteredValues: FormFieldValues,
): FormFieldValues => {
  const fieldIds = new Set(precedingSteps.flatMap((step) => step.edit))
  const picked: FormFieldValues = {}
  for (const fieldId of fieldIds) {
    if (enteredValues[fieldId] !== undefined) {
      picked[fieldId] = enteredValues[fieldId]
    }
  }
  return picked
}
