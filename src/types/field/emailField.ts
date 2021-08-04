import {
  AutoReplyOptions,
  BasicField,
  EmailFieldBase,
} from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { AutoReplyOptions }

export { EmailFieldBase }
export interface IEmailFieldSchema extends EmailFieldBase, IFieldSchema {
  fieldType: BasicField.Email
  isVerifiable: boolean
}
