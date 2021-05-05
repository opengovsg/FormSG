import { IFieldSchema } from './baseField'
import { IEmailField } from './fieldTypes'

export interface IEmailFieldSchema extends IEmailField, IFieldSchema {
  isVerifiable: boolean
}
