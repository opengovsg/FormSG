import { FieldBase, BasicField } from './base'
import { DropdownFieldBase } from './dropdownField'
import { ShortTextFieldBase } from './shortTextField'

export interface ShortTextColumnBase extends ShortTextFieldBase {
  columnType: BasicField.ShortText
}
export interface DropdownColumnBase extends DropdownFieldBase {
  columnType: BasicField.Dropdown
}

export type Column = ShortTextColumnBase | DropdownColumnBase

export interface TableFieldBase extends FieldBase {
  fieldType: BasicField.Table
  minimumRows: number
  addMoreRows?: boolean
  maximumRows?: number
  columns: Column[]
}
