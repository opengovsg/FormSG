import { BasicField, FieldBase } from './base'

export interface LinkFieldBase extends FieldBase {
  fieldType: BasicField.Link
  url: string
}
