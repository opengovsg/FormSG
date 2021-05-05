import { IFieldSchema } from './baseField'
import { IMobileField } from './fieldTypes'

export interface IMobileFieldSchema extends IMobileField, IFieldSchema {
  isVerifiable: boolean
}
