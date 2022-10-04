import { ALLOWED_LOGIC_FIELDS_ARRAY } from '~features/logic/constants'

import { BASICFIELD_TO_DRAWER_META } from '../constants'

export const ALLOWED_FIELDS_META = ALLOWED_LOGIC_FIELDS_ARRAY.map(
  (fieldType) => BASICFIELD_TO_DRAWER_META[fieldType],
)
