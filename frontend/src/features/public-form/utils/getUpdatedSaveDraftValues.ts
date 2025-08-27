import { isEmpty, keysIn, pick } from 'lodash'

import { FormFieldValues } from '~templates/Field'

export const getUpdatedSaveDraftResponses = ({
  formFieldValues,
  dirtyFields,
  previousDraftResponses,
  existingFormFieldIds,
}: {
  formFieldValues: FormFieldValues
  dirtyFields: Record<string, boolean>
  previousDraftResponses?: FormFieldValues | null
  existingFormFieldIds: string[]
}) => {
  const dirtyFieldKeys =
    dirtyFields || isEmpty(dirtyFields) ? keysIn(dirtyFields) : []
  const newDraftChanges = pick(formFieldValues, dirtyFieldKeys)
  const updatedDraftResponses = previousDraftResponses
    ? { ...previousDraftResponses, ...newDraftChanges }
    : newDraftChanges

  // If the field id no longer exists in the form, remove it from the saved draft.
  const filteredDraftResponses = existingFormFieldIds.reduce(
    (acc, formFieldId) => {
      if (formFieldId in updatedDraftResponses) {
        acc[formFieldId] = updatedDraftResponses[formFieldId]
      }
      return acc
    },
    {} as FormFieldValues,
  )

  if (isEmpty(filteredDraftResponses)) {
    return null
  }
  return filteredDraftResponses
}
