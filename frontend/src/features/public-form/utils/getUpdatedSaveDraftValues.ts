import { difference, isEmpty, pick } from 'lodash'

import { FormFieldValues } from '~templates/Field'

export const getUpdatedSaveDraftResponses = ({
  previousDraftResponses,
  formFieldValues,
  dirtyFieldIds,
  existingFormFieldIds,
  myInfoFieldIds,
}: {
  previousDraftResponses?: FormFieldValues | null
  formFieldValues: FormFieldValues
  dirtyFieldIds: string[]
  existingFormFieldIds: string[]
  myInfoFieldIds: string[]
}): FormFieldValues | null => {
  const currentDirtyFieldValues = pick(formFieldValues, dirtyFieldIds)

  const allDirtyFieldValues = {
    ...(previousDraftResponses ?? {}),
    ...currentDirtyFieldValues,
  }
  const fieldIdsToInclude = difference(existingFormFieldIds, myInfoFieldIds)

  const updatedDraftResponses = pick(allDirtyFieldValues, fieldIdsToInclude)

  if (isEmpty(updatedDraftResponses)) {
    return null
  }
  return updatedDraftResponses
}
