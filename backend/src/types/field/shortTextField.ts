import { IFieldSchema } from './baseField'
import { IShortTextField } from './fieldTypes'

export interface IShortTextFieldSchema extends IShortTextField, IFieldSchema {
  // Prefill flag
  allowPrefill?: boolean
}
