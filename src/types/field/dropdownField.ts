import { BasicField, DropdownFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IDropdownFieldSchema extends DropdownFieldBase, IFieldSchema {
  fieldType: BasicField.Dropdown
}
