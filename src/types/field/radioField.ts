import { BasicField, RadioFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { RadioFieldBase }
export interface IRadioFieldSchema extends RadioFieldBase, IFieldSchema {
  fieldType: BasicField.Radio
}
