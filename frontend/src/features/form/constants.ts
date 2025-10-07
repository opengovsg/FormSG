import { BasicField } from '~shared/types'

export const NON_RESPONSE_FIELD_SET = new Set([
  BasicField.Section,
  BasicField.Statement,
  BasicField.Image,
])

export const SAVE_DRAFT_INDEXEDDB_STORE_NAME = 'savedDrafts'
