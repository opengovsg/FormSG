import { difference, isEmpty, mapValues, pick } from 'lodash'

import { BasicField, FormFieldDto } from '~shared/types'

import { FormFieldValues, VerifiableFieldValues } from '~templates/Field'

import { isMyInfo } from '~features/myinfo/utils'

export const getUpdatedSaveDraftResponses = ({
  previousDraftResponses,
  formFieldValues,
  dirtyFieldIds,
  formFields,
}: {
  previousDraftResponses?: FormFieldValues | null
  formFieldValues: FormFieldValues
  dirtyFieldIds: string[]
  formFields: FormFieldDto[]
}): FormFieldValues | null => {
  // Note: payment fields are not included in formFields to keep the implementation simple,
  // hence they will not be saved in the draft.
  const validFormFieldIds = [
    ...formFields
      // Exclude non-fillable fields from the draft
      .filter(
        (field) =>
          field.fieldType !== BasicField.Section &&
          field.fieldType !== BasicField.Statement,
      )
      .map((field) => field._id),
  ]
  const myInfoFieldIds = formFields
    .filter((field) => isMyInfo(field))
    .map((field) => field._id)

  const verifiableFieldIds = formFields
    .filter(
      (field) =>
        (field.fieldType === BasicField.Mobile ||
          field.fieldType === BasicField.Email) &&
        field.isVerifiable,
    )
    .map((field) => field._id)

  const currentDirtyFieldValues = pick(formFieldValues, dirtyFieldIds)

  const allDirtyFieldValues = {
    ...(previousDraftResponses ?? {}),
    ...currentDirtyFieldValues,
  }
  const fieldIdsToInclude = difference(validFormFieldIds, myInfoFieldIds)

  const updatedDraftResponses = pick(allDirtyFieldValues, fieldIdsToInclude)

  // Avoid saving 'signature' property values from verifiable fields in the draft.
  // This is to prevent signature from being reused and to force the user to
  // re-verify the field value when they restore the draft.
  const updatedDraftResponsesWithoutVerifiableFieldSignatures = mapValues(
    updatedDraftResponses,
    (fieldValue, fieldId) =>
      verifiableFieldIds.includes(fieldId)
        ? { ...(fieldValue as VerifiableFieldValues), signature: undefined }
        : fieldValue,
  )

  if (isEmpty(updatedDraftResponsesWithoutVerifiableFieldSignatures)) {
    return null
  }
  return updatedDraftResponsesWithoutVerifiableFieldSignatures
}
