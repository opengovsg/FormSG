import { BasicField, CheckboxFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface ICheckboxFieldSchema extends CheckboxFieldBase, IFieldSchema {
  fieldType: BasicField.Checkbox
}
