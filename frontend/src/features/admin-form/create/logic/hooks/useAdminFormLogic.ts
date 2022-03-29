import { useMemo } from 'react'

import { FormFieldDto } from '~shared/types/field'

import { useAdminForm } from '~features/admin-form/common/queries'

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

  return {
    isLoading,
    formLogics: form?.form_logics,
    mapIdToField,
  }
}
