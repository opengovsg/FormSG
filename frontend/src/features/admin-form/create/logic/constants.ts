import { BasicField } from '~shared/types/field'

import { BASICFIELD_TO_DRAWER_META } from '../constants'

export const ALLOWED_LOGIC_FIELDS = new Set([
  BasicField.YesNo,
  BasicField.Radio,
  BasicField.Rating,
  BasicField.Number,
  BasicField.Decimal,
  BasicField.Dropdown,
])

export const ALLOWED_FIELDS_META = Array.from(ALLOWED_LOGIC_FIELDS).map(
  (fieldType) => BASICFIELD_TO_DRAWER_META[fieldType],
)
