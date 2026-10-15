import { BasicField, MyInfoAttribute, NricFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface INricFieldSchema extends NricFieldBase, IFieldSchema {
  fieldType: BasicField.Nric
  myInfo?: { attr: MyInfoAttribute.UinFin }
}
