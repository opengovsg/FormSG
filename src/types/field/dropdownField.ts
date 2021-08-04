import { BasicField, DropdownFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { DropdownFieldBase }

export interface IDropdownFieldSchema extends DropdownFieldBase, IFieldSchema {
  fieldType: BasicField.Dropdown
}
