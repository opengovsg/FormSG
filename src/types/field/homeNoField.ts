import { BasicField, HomenoFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { HomenoFieldBase }

export interface IHomenoFieldSchema extends HomenoFieldBase, IFieldSchema {
  fieldType: BasicField.HomeNo
}
