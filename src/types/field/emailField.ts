import { BasicField, EmailFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface IEmailFieldSchema extends EmailFieldBase, IFieldSchema {
  fieldType: BasicField.Email
  isVerifiable: boolean
}
