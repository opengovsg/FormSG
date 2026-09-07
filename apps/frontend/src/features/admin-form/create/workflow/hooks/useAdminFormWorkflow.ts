import { useMemo } from 'react'
import { keyBy } from 'lodash'

import {
  BasicField,
  DropdownFieldBase,
  EmailFieldBase,
  FormFieldDto,
  FormResponseMode,
  YesNoFieldBase,
} from 'formsg-shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'
import { FormFieldWithQuestionNo } from '~features/form/types'
import { augmentFieldWithQuestionNo } from '~features/form/utils'
import { augmentWithMyInfo } from '~features/myinfo/utils'

export const useAdminFormWorkflow = () => {
  const { data: form, isLoading } = useAdminForm()

  // Memoised on form_fields. Without this the array identity changes on every
  // render, so the four useMemos below never hit and every consumer redoes a
  // keyBy plus three filters over every field in the form.
  const augmentedFormFields = useMemo(
    () =>
      augmentFieldWithQuestionNo(
        form?.form_fields.map(augmentWithMyInfo) ?? [],
      ),
    [form?.form_fields],
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

  const yesNoFormFields = useMemo(
    () =>
      augmentedFormFields.filter(
        (
          field,
        ): field is FormFieldWithQuestionNo<FormFieldDto<YesNoFieldBase>> =>
          field.fieldType === BasicField.YesNo,
      ),
    [augmentedFormFields],
  )

  const dropdownFormFields = useMemo(
    () =>
      augmentedFormFields.filter(
        (
          field,
        ): field is FormFieldWithQuestionNo<FormFieldDto<DropdownFieldBase>> =>
          field.fieldType === BasicField.Dropdown,
      ),
    [augmentedFormFields],
  )

  const formWorkflow =
    form?.responseMode === FormResponseMode.Multirespondent
      ? form.workflow
      : undefined

  return {
    isLoading,
    formFields: form?.form_fields,
    formWorkflow,
    isPaymentEnabled:
      form?.responseMode === FormResponseMode.Multirespondent &&
      !!form.payments_field?.enabled,
    idToFieldMap,
    emailFormFields,
    yesNoFormFields,
    dropdownFormFields,
  }
}
