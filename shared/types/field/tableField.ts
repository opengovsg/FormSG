import { FieldBase, BasicField } from './base'
import { DropdownFieldBase } from './dropdownField'
import { ShortTextFieldBase } from './shortTextField'

// Column types do not have misc field base props.
type WithFieldBasePropsRemoved<T> = Omit<T, keyof FieldBase>
export interface ShortTextColumnBase
  extends WithFieldBasePropsRemoved<ShortTextFieldBase> {
  columnType: BasicField.ShortText
}
export interface DropdownColumnBase
  extends WithFieldBasePropsRemoved<DropdownFieldBase> {
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
