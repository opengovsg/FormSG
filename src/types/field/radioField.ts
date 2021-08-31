import { BasicField, RadioFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IRadioFieldSchema extends RadioFieldBase, IFieldSchema {
  fieldType: BasicField.Radio
}
