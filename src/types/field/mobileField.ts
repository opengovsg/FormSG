import { BasicField, MobileFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IMobileFieldSchema extends MobileFieldBase, IFieldSchema {
  fieldType: BasicField.Mobile
  isVerifiable: boolean
}
