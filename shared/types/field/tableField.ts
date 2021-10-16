import { FieldBase, BasicField } from './base'
import { DropdownFieldBase } from './dropdownField'
import { ShortTextFieldBase } from './shortTextField'
import { RequireAllOrNone } from 'type-fest'

// Column types do not have most field base props.
type ColumnBase<T extends FieldBase> = Omit<T, keyof FieldBase> & {
  title: string
  required: boolean
}
export interface ShortTextColumnBase extends ColumnBase<ShortTextFieldBase> {
  columnType: BasicField.ShortText
}
export interface DropdownColumnBase extends ColumnBase<DropdownFieldBase> {
  columnType: BasicField.Dropdown
}

export type Column = ShortTextColumnBase | DropdownColumnBase

export type TableFieldBase = RequireAllOrNone<
  FieldBase & {
    fieldType: BasicField.Table
    minimumRows: number
    columns: Column[]
    addMoreRows?: boolean
    maximumRows?: number
  },
  'addMoreRows' | 'maximumRows'
>
