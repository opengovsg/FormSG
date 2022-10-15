import cuid from 'cuid'
import produce from 'immer'

import {
  BasicField,
  FieldCreateDto,
  FormField,
  FormFieldDto,
  TableFieldDto,
} from '~shared/types/field'

import { NON_RESPONSE_FIELD_SET } from '~features/form/constants'
import { FormFieldWithQuestionNo } from '~features/form/types'
import { addMyInfo } from '~features/myinfo/utils/augmentWithMyInfo'

import { PENDING_CREATE_FIELD_ID } from '../constants'
import { useCreateTabForm } from '../useCreateTabForm'
import {
  FieldBuilderState,
  stateDataSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'

const mutateFormFieldsWhileCreating = (
  draftBuilerFields: FormFieldDto[],
  fieldToCreate: { field: FieldCreateDto; insertionIndex: number },
) => {
  if (fieldToCreate.field.fieldType === BasicField.Table) {
    const newField: TableFieldDto = {
      ...fieldToCreate.field,
      _id: PENDING_CREATE_FIELD_ID,
      columns: fieldToCreate.field.columns.map((column) => ({
        ...column,
        _id: cuid(),
      })),
    }
    draftBuilerFields.splice(fieldToCreate.insertionIndex, 0, newField)
  } else {
    draftBuilerFields.splice(fieldToCreate.insertionIndex, 0, {
      ...(fieldToCreate.field as FormFieldDto<
        Exclude<FormField, TableFieldDto>
      >),
      _id: PENDING_CREATE_FIELD_ID,
    })
  }
}

const mutateFormFieldsWhileEditing = (
  draftBuilderFields: FormFieldDto[],
  editingField: FormFieldDto,
): void => {
  const editingFieldIndex = draftBuilderFields.findIndex(
    (ff) => ff._id === editingField._id,
  )
  if (editingFieldIndex < 0) return
  draftBuilderFields[editingFieldIndex] = editingField
}

const addQuestionNo = (draftBuilderFields: FormFieldWithQuestionNo[]): void => {
  let questionNumber = 1
  for (let i = 0; i < draftBuilderFields.length; i++) {
    if (!NON_RESPONSE_FIELD_SET.has(draftBuilderFields[i].fieldType)) {
      draftBuilderFields[i] = {
        ...draftBuilderFields[i],
        questionNumber: questionNumber++,
      }
    }
  }
}

export const useBuilderFields = () => {
  const { data: formData, isLoading } = useCreateTabForm()
  const stateData = useFieldBuilderStore(stateDataSelector)

  const builderFields = formData?.form_fields
  if (isLoading || !builderFields)
    return {
      builderFields,
      isLoading,
    }
  const nextBuilderFields = produce(builderFields, (draftBuilderFields) => {
    if (stateData.state === FieldBuilderState.EditingField) {
      mutateFormFieldsWhileEditing(draftBuilderFields, stateData.field)
    } else if (stateData.state === FieldBuilderState.CreatingField) {
      mutateFormFieldsWhileCreating(draftBuilderFields, stateData)
    }
    addQuestionNo(draftBuilderFields)
    addMyInfo(draftBuilderFields)
  })

  return {
    builderFields: nextBuilderFields,
    isLoading,
  }
}
