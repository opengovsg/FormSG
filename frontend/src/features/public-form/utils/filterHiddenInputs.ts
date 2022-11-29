import { pick } from 'lodash'

import type { FormDto, FormFieldDto } from '~shared/types'

import type { FormFieldValues } from '~templates/Field/types'

// Cannot import from directory index because of circular imports.
import { getVisibleFieldIds } from '~features/logic/utils/getVisibleFieldIds'

export const filterHiddenInputs = ({
  formFields,
  formInputs = {},
  formLogics,
}: {
  formFields: FormFieldDto[]
  formLogics: FormDto['form_logics']
  formInputs: FormFieldValues
}) => {
  // Remove form inputs (could be prefilled/MyInfo) from fields hidden due to logic.
  const visibleFieldIds = getVisibleFieldIds(formInputs, {
    formFields,
    formLogics,
  })
  const filteredFormInputs = pick(formInputs, Array.from(visibleFieldIds))

  return filteredFormInputs
}
