import { useMemo } from 'react'
import { keyBy } from 'lodash'

import {
  BasicField,
  EmailFieldBase,
  FormFieldDto,
  FormResponseMode,
} from '~shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'
import { FormFieldWithQuestionNo } from '~features/form/types'
import { augmentWithQuestionNo } from '~features/form/utils'
import { augmentWithMyInfo } from '~features/myinfo/utils'

export const useAdminFormWorkflow = () => {
  const { data: form, isLoading } = useAdminForm()

  const augmentedFormFields = augmentWithQuestionNo(
    form?.form_fields.map(augmentWithMyInfo) ?? [],
  )

  const idToFieldMap = useMemo(
    () => keyBy(augmentedFormFields, '_id'),
    [augmentedFormFields],
  )

  const emailFormFields = useMemo(
    () =>
      augmentedFormFields.filter(
        (
          field,
        ): field is FormFieldWithQuestionNo<FormFieldDto<EmailFieldBase>> =>
          field.fieldType === BasicField.Email,
      ),
    [augmentedFormFields],
  )

  return {
    isLoading,
    formFields: form?.form_fields,
    formWorkflow:
      form?.responseMode !== FormResponseMode.Multirespondent
        ? undefined
        : form?.workflow,
    idToFieldMap,
    emailFormFields,
  }
}
