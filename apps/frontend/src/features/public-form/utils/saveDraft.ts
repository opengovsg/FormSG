import {
  difference,
  intersection,
  isEmpty,
  mapValues,
  pick,
  union,
} from 'lodash'

import {
  BasicField,
  FormFieldDto,
  StrippedFormFieldDto,
  StrippedFormWorkflowStepDto,
} from 'formsg-shared/types'

import { FormFieldValues, VerifiableFieldValues } from '~templates/Field'

import { isFieldEnabledByMrfWorkflow } from '~features/form/utils/augmentFieldWithMrfWorkflowDisabling'
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
  previousRestoredDraftResponses,
  currentFormFieldValues: formFieldValues,
  dirtyFieldIds,
  prefilledFieldIds,
  currentStepNumberWorkflowStep,
  formFields,
}: {
  previousRestoredDraftResponses?: FormFieldValues | null
  currentFormFieldValues: FormFieldValues
  dirtyFieldIds: string[]
  prefilledFieldIds: string[]
  currentStepNumberWorkflowStep: StrippedFormWorkflowStepDto | undefined
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

  const editableFieldIds = formFields
    .filter((field) =>
      isFieldEnabledByMrfWorkflow(currentStepNumberWorkflowStep, field),
    )
    .map((field) => field._id)
  // RATIONALE: Dirty (edited) and prefilled fields that are editable for this workflow step (if exists) should be included in the draft.
  const fieldIdsToSave = intersection(
    union(dirtyFieldIds, prefilledFieldIds),
    editableFieldIds,
  )
  const fieldValuesToSave = pick(formFieldValues, fieldIdsToSave)

  const allFieldValuesToSave = {
    ...(previousRestoredDraftResponses ?? {}),
    ...fieldValuesToSave,
  }
  const fieldIdsToInclude = difference(
    currentlyExistingFieldIds,
    myInfoFieldIds,
  )

  const updatedDraftResponses = pick(allFieldValuesToSave, fieldIdsToInclude)

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
  savedDraftSubmission?: Pick<
    DraftSubmission,
    'draftResponses' | 'fieldDefinitionsChecksum'
  >
}): {
  draftResponsesToRestore: FormFieldValues
  changedFieldIds: string[]
  unchangedFieldIds: string[]
} => {
  const formFieldIdsToChecksumMap =
    getFormFieldIdsToChecksumMap(currentFormFields)

  const { draftResponses, fieldDefinitionsChecksum } =
    savedDraftSubmission ?? {}

  const currentlyExistingFieldIds = intersection(
    Object.keys(formFieldIdsToChecksumMap),
    Object.keys(fieldDefinitionsChecksum ?? {}),
  )

  const unchangedFieldIds = currentlyExistingFieldIds.filter(
    (fieldId) =>
      fieldDefinitionsChecksum &&
      formFieldIdsToChecksumMap[fieldId] &&
      fieldDefinitionsChecksum[fieldId] &&
      formFieldIdsToChecksumMap[fieldId] === fieldDefinitionsChecksum[fieldId],
  )

  const formFieldsToRestore = pick(
    draftResponses,
    unchangedFieldIds,
  ) as FormFieldValues

  const changedFieldIds = difference(
    Object.keys(draftResponses ?? {}),
    unchangedFieldIds,
  )

  return {
    draftResponsesToRestore: formFieldsToRestore,
    changedFieldIds,
    unchangedFieldIds,
  }
}
