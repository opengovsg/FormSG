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
  console.log('dirtyFieldIds:', dirtyFieldIds)
  console.log('existingFieldIds:', existingFormFieldIds)
  console.log('myInfoFieldIds:', myInfoFieldIds)

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
