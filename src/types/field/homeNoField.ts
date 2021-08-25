import { BasicField, HomenoFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IHomenoFieldSchema extends HomenoFieldBase, IFieldSchema {
  fieldType: BasicField.HomeNo
}
