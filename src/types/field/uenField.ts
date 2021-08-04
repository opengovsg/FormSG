import { BasicField, UenFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { UenFieldBase }

export interface IUenFieldSchema extends UenFieldBase, IFieldSchema {
  fieldType: BasicField.Uen
}
