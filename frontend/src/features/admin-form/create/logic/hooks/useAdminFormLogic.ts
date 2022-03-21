import { useMemo } from 'react'
import { keyBy } from 'lodash'

import { useAdminForm } from '~features/admin-form/common/queries'
import { augmentWithQuestionNo } from '~features/form/utils/augmentWithQuestionNo'

export const useAdminFormLogic = () => {
  const { data: form, isLoading } = useAdminForm()

  const mapIdToField = useMemo(() => {
    if (!form) return null

    const augmentedFormFields = augmentWithQuestionNo(form.form_fields)
    return keyBy(augmentedFormFields, '_id')
  }, [form])

  return {
    isLoading,
    formLogics: form?.form_logics,
    mapIdToField,
  }
}
