import { useMemo } from 'react'
import pickBy from 'lodash/pickBy'

import { FormFieldDto } from '~shared/types/field'

import { useAdminForm } from '~features/admin-form/common/queries'

import { ALLOWED_LOGIC_FIELDS } from '../constants'
import { FormFieldWithQuestionNumber } from '../types'

export const useAdminFormLogic = () => {
  const { data: form, isLoading } = useAdminForm()

  const mapIdToField = useMemo(() => {
    if (!form) return null

    return form.form_fields.reduce((acc, field, index) => {
      acc[field._id] = { ...field, questionNumber: index + 1 }
      return acc
    }, {} as Record<FormFieldDto['_id'], FormFieldWithQuestionNumber>)
  }, [form])

  const logicableFields = useMemo(() => {
    if (!mapIdToField) return null
    return pickBy(mapIdToField, (f) => ALLOWED_LOGIC_FIELDS.has(f.fieldType))
  }, [mapIdToField])

  return {
    isLoading,
    formLogics: form?.form_logics,
    logicableFields,
    mapIdToField,
  }
}
