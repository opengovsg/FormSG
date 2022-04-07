import { LOGIC_MAP } from '~shared/modules/logic'

import { BASICFIELD_TO_DRAWER_META } from '../constants'

const ALLOWED_LOGIC_FIELDS_ARRAY = [...LOGIC_MAP.keys()]

export const ALLOWED_LOGIC_FIELDS = new Set(ALLOWED_LOGIC_FIELDS_ARRAY)

export const ALLOWED_FIELDS_META = ALLOWED_LOGIC_FIELDS_ARRAY.map(
  (fieldType) => BASICFIELD_TO_DRAWER_META[fieldType],
)
