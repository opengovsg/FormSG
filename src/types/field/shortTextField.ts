import { ITextField } from './utils/textField'
import { IFieldSchema } from './baseField'

export type IShortTextField = ITextField

export interface IShortTextFieldSchema extends IShortTextField, IFieldSchema {
  // Prefill flag
  allowPrefill?: boolean
}
