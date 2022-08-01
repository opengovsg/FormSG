import { useMemo } from 'react'
import cuid from 'cuid'

import {
  BasicField,
  FieldCreateDto,
  FormFieldDto,
  TableFieldDto,
} from '~shared/types/field'
import { insertAt, replaceAt } from '~shared/utils/immutable-array-fns'

import { augmentWithMyInfo } from '~features/myinfo/utils/augmentWithMyInfo'

import { PENDING_CREATE_FIELD_ID } from '../constants'
import {
  BuildFieldState,
  stateDataSelector,
  useBuilderAndDesignStore,
} from '../useBuilderAndDesignStore'
import { useCreateTabForm } from '../useCreateTabForm'

const getFormFieldsWhileCreating = (
  formFields: FormFieldDto[],
  fieldToCreate: { field: FieldCreateDto; insertionIndex: number },
): FormFieldDto[] => {
  if (fieldToCreate.field.fieldType === BasicField.Table) {
    const newField: TableFieldDto = {
      ...fieldToCreate.field,
      _id: PENDING_CREATE_FIELD_ID,
      columns: fieldToCreate.field.columns.map((column) => ({
        ...column,
        _id: cuid(),
      })),
    }
    return insertAt(formFields, fieldToCreate.insertionIndex, newField)
  }
  return insertAt(formFields, fieldToCreate.insertionIndex, {
    ...fieldToCreate.field,
    _id: PENDING_CREATE_FIELD_ID,
  })
}

const getFormFieldsWhileEditing = (
  formFields: FormFieldDto[],
  editingField: FormFieldDto,
): FormFieldDto[] => {
  const editingFieldIndex = formFields.findIndex(
    (ff) => ff._id === editingField._id,
  )
  if (editingFieldIndex < 0) return formFields
  return replaceAt(formFields, editingFieldIndex, editingField)
}

export const useBuilderFields = () => {
  const { data: formData } = useCreateTabForm()
  const stateData = useBuilderAndDesignStore(stateDataSelector)
  const builderFields = useMemo(() => {
    let existingFields = formData?.form_fields
    if (!existingFields) return null
    if (stateData.state === BuildFieldState.EditingField) {
      existingFields = getFormFieldsWhileEditing(
        existingFields,
        stateData.field,
      )
    } else if (stateData.state === BuildFieldState.CreatingField) {
      existingFields = getFormFieldsWhileCreating(existingFields, stateData)
    }

    return existingFields.map(augmentWithMyInfo)
  }, [formData, stateData])

  return {
    builderFields,
  }
}
