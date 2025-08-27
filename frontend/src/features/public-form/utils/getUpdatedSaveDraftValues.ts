import { isEmpty, keysIn, pick } from 'lodash'

import { FormFieldValues } from '~templates/Field'

export const getUpdatedSaveDraftResponses = ({
  formFieldValues,
  dirtyFields,
  previousDraftResponses,
}: {
  formFieldValues: FormFieldValues
  dirtyFields: Record<string, boolean>
  previousDraftResponses?: FormFieldValues | null
}) => {
  const dirtyFieldKeys =
    dirtyFields || isEmpty(dirtyFields) ? keysIn(dirtyFields) : []
  const newDraftChanges = pick(formFieldValues, dirtyFieldKeys)
  const updatedDraftResponses = previousDraftResponses
    ? { ...previousDraftResponses, ...newDraftChanges }
    : newDraftChanges

  if (isEmpty(updatedDraftResponses)) {
    return null
  }
  return updatedDraftResponses
}
