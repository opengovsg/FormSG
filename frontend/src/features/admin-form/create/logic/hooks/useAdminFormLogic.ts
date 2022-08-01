import { useMemo } from 'react'
import { keyBy } from 'lodash'
import pickBy from 'lodash/pickBy'

import { LogicType } from '~shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'
import { augmentWithQuestionNo } from '~features/form/utils/augmentWithQuestionNo'
import { ALLOWED_LOGIC_FIELDS } from '~features/logic/constants'

export const useAdminFormLogic = () => {
  const { data: form, isLoading } = useAdminForm()

  const mapIdToField = useMemo(() => {
    if (!form) return null

    const augmentedFormFields = augmentWithQuestionNo(form.form_fields)
    return keyBy(augmentedFormFields, '_id')
  }, [form])

  const logicableFields = useMemo(() => {
    if (!mapIdToField) return null
    return pickBy(mapIdToField, (f) => ALLOWED_LOGIC_FIELDS.has(f.fieldType))
  }, [mapIdToField])

  const hasError = useMemo(
    () =>
      !mapIdToField
        ? false
        : form?.form_logics.some(
            (logic) =>
              // Logic is errored if some condition does not exist, or all the
              // show fields do not exist.
              logic.conditions.some(
                (condition) => !(condition.field in mapIdToField),
              ) ||
              (logic.logicType === LogicType.ShowFields &&
                logic.show.every((field) => !(field in mapIdToField))),
          ),
    [form?.form_logics, mapIdToField],
  )

  return {
    isLoading,
    formLogics: form?.form_logics,
    formFields: form?.form_fields,
    logicableFields,
    mapIdToField,
    hasError,
  }
}
