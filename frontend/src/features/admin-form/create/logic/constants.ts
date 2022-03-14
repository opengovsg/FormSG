import { BasicField } from '~shared/types/field'

import { BASICFIELD_TO_DRAWER_META } from '../constants'

const ALLOWED_LOGIC_FIELDS_ARRAY = [
  BasicField.YesNo,
  BasicField.Radio,
  BasicField.Rating,
  BasicField.Number,
  BasicField.Decimal,
  BasicField.Dropdown,
]

export const ALLOWED_LOGIC_FIELDS = new Set(ALLOWED_LOGIC_FIELDS_ARRAY)

export const ALLOWED_FIELDS_META = ALLOWED_LOGIC_FIELDS_ARRAY.map(
  (fieldType) => BASICFIELD_TO_DRAWER_META[fieldType],
)
