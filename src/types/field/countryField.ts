import { BasicField, DropdownFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export type ICountryField = DropdownFieldBase

export interface ICountryFieldSchema extends ICountryField, IFieldSchema {
  fieldType: BasicField.Dropdown
}
