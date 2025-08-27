import { difference, intersection, isEmpty, pick } from 'lodash'

import { FormFieldValues } from '~templates/Field'

export const getUpdatedSaveDraftResponses = ({
  formFieldValues,
  dirtyFieldIds,
  existingFormFieldIds,
  myInfoFieldIds,
}: {
  formFieldValues: FormFieldValues
  dirtyFieldIds: string[]
  existingFormFieldIds: string[]
  myInfoFieldIds: string[]
}) => {
  const fieldIdsToInclude = difference(
    intersection(dirtyFieldIds, existingFormFieldIds),
    myInfoFieldIds,
  )

  const updatedDraftResponses = pick(formFieldValues, fieldIdsToInclude)

  if (isEmpty(updatedDraftResponses)) {
    return null
  }
  return updatedDraftResponses
}
