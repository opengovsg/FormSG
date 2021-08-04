import { BasicField, CheckboxFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { CheckboxFieldBase }

export interface ICheckboxFieldSchema extends CheckboxFieldBase, IFieldSchema {
  fieldType: BasicField.Checkbox
}
