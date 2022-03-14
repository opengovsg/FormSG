import { useMemo } from 'react'

import { FieldCreateDto, FormFieldDto } from '~shared/types/field'
import { insertAt, replaceAt } from '~shared/utils/immutable-array-fns'

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
    const existingFields = formData?.form_fields
    if (!existingFields) return null
    if (stateData.state === BuildFieldState.EditingField) {
      return getFormFieldsWhileEditing(existingFields, stateData.field)
    }
    if (stateData.state === BuildFieldState.CreatingField) {
      return getFormFieldsWhileCreating(existingFields, stateData)
    }
    return existingFields
  }, [formData, stateData])

  return { builderFields }
}
