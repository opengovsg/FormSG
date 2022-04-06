import { BasicField } from '~shared/types/field'

import { LogicableField } from './types'

export const ALLOWED_LOGIC_FIELDS_ARRAY: LogicableField[] = [
  BasicField.YesNo,
  BasicField.Radio,
  BasicField.Rating,
  BasicField.Number,
  BasicField.Decimal,
  BasicField.Dropdown,
]

export const ALLOWED_LOGIC_FIELDS = new Set(ALLOWED_LOGIC_FIELDS_ARRAY)
