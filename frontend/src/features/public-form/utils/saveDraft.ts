import {
  difference,
  intersection,
  isEmpty,
  mapValues,
  partition,
  pick,
} from 'lodash'

import { BasicField, FormFieldDto } from '~shared/types'

import { FormFieldValues, VerifiableFieldValues } from '~templates/Field'

import { isMyInfo } from '~features/myinfo/utils'

import { DraftSubmission } from '../PublicFormContext'

const getFormFieldIdsToChecksumMap = (formFields: FormFieldDto[]) => {
  return formFields.reduce(
    (acc, field) => {
      acc[field._id] = JSON.stringify(field)
      return acc
    },
    {} as Record<string, string>,
  )
}

export const getDraftToSave = ({
  previousDraftResponses,
  currentFormFieldValues: formFieldValues,
  dirtyFieldIds,
  formFields,
}: {
  previousDraftResponses?: FormFieldValues | null
  currentFormFieldValues: FormFieldValues
  dirtyFieldIds: string[]
  formFields: FormFieldDto[]
}): DraftSubmission => {
  // Note: payment fields are not included in formFields to keep the implementation simple,
  // hence they will not be saved in the draft.
  const currentlyExistingFieldIds = [
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
  const fieldIdsToInclude = difference(
    currentlyExistingFieldIds,
    myInfoFieldIds,
  )

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
    return {
      lastUpdated: Date.now(),
      draftResponses: null,
      fieldDefinitionsChecksum: null,
    }
  }

  const formFieldIdsToChecksumMap = getFormFieldIdsToChecksumMap(formFields)
  const fieldDefinitionsChecksum = pick(
    formFieldIdsToChecksumMap,
    Object.keys(updatedDraftResponsesWithoutVerifiableFieldSignatures),
  )

  return {
    lastUpdated: Date.now(),
    draftResponses: updatedDraftResponsesWithoutVerifiableFieldSignatures,
    fieldDefinitionsChecksum,
  }
}

export const getRestoreDraftFormValues = ({
  currentFormFields,
  savedDraftSubmission,
}: {
  currentFormFields: FormFieldDto[]
  savedDraftSubmission: Pick<
    DraftSubmission,
    'draftResponses' | 'fieldDefinitionsChecksum'
  >
}): {
  draftResponsesToRestore: FormFieldValues
  changedFieldIds: string[]
  restoredFieldIds: string[]
} => {
  const formFieldIdsToChecksumMap =
    getFormFieldIdsToChecksumMap(currentFormFields)

  const { draftResponses, fieldDefinitionsChecksum } =
    savedDraftSubmission ?? {}

  const currentlyExistingFieldIds = intersection(
    Object.keys(formFieldIdsToChecksumMap),
    Object.keys(fieldDefinitionsChecksum ?? {}),
  )

  const [unchangedFieldIds, changedFieldIds] = partition(
    currentlyExistingFieldIds,
    (fieldId) =>
      fieldDefinitionsChecksum &&
      formFieldIdsToChecksumMap[fieldId] === fieldDefinitionsChecksum[fieldId],
  )

  const formFieldsToRestore = pick(
    draftResponses,
    unchangedFieldIds,
  ) as FormFieldValues

  return {
    draftResponsesToRestore: formFieldsToRestore,
    changedFieldIds,
    restoredFieldIds: unchangedFieldIds,
  }
}
