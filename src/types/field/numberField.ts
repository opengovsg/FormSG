import {
  BasicField,
  NumberFieldBase,
  NumberSelectedValidation,
  NumberValidationOptions,
} from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { NumberValidationOptions, NumberSelectedValidation, NumberFieldBase }

export interface INumberFieldSchema extends NumberFieldBase, IFieldSchema {
  fieldType: BasicField.Number
}
