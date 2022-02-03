import { BasicField } from '~shared/types/field'

import { BASICFIELD_TO_ICON, BASICFIELD_TO_READABLE } from '../constants'

export const ALLOWED_LOGIC_FIELDS = new Set([
  BasicField.YesNo,
  BasicField.Radio,
  BasicField.Rating,
  BasicField.Number,
  BasicField.Decimal,
  BasicField.Dropdown,
])

export const ALLOWED_FIELDS_META = Array.from(ALLOWED_LOGIC_FIELDS).map(
  (fieldType) => ({
    label: BASICFIELD_TO_READABLE[fieldType],
    icon: BASICFIELD_TO_ICON[fieldType],
  }),
)
