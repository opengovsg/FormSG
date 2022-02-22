import { useEffect, useState } from 'react'

import { FormFieldDto } from '~shared/types/field'
import { insertAt } from '~shared/utils/immutable-array-fns'

import { useAdminForm } from '~features/admin-form/common/queries'

import { EditFieldStoreState, useEditFieldStore } from './editFieldStore'
import { BuilderContentField } from './types'
import { getFieldCreationMeta } from './utils'

const editFieldStoreSelector = (state: EditFieldStoreState) => ({
  clearActiveField: state.clearActiveField,
  fieldToCreate: state.fieldToCreate,
  clearFieldToCreate: state.clearFieldToCreate,
  updateActiveField: state.updateActiveField,
})

const getComputedFormFields = ({
  formFields,
  fieldToCreate,
}: {
  formFields?: FormFieldDto[]
  fieldToCreate: EditFieldStoreState['fieldToCreate']
}) => {
  if (!formFields) {
    return
  }
  if (fieldToCreate) {
    return insertAt(
      formFields,
      fieldToCreate.insertionIndex,
      getFieldCreationMeta(fieldToCreate.fieldType),
    )
  } else {
    return formFields
  }
}

export const useBuilderFormFields = () => {
  const { fieldToCreate, updateActiveField } = useEditFieldStore(
    editFieldStoreSelector,
  )

  const { data } = useAdminForm({
    // Only fetch when there are no fields to create.
    enabled: !fieldToCreate,
  })

  const [builderFields, setBuilderFields] = useState<
    BuilderContentField[] | undefined
  >(data?.form_fields)

  // Update form fields whenever admin form changes
  useEffect(() => {
    const nextFormFields = getComputedFormFields({
      fieldToCreate,
      formFields: data?.form_fields,
    })
    if (nextFormFields) {
      setBuilderFields(nextFormFields)
      if (fieldToCreate) {
        updateActiveField(nextFormFields[fieldToCreate.insertionIndex])
      }
    }
  }, [data?.form_fields, fieldToCreate, updateActiveField])

  return {
    builderFields,
  }
}
