import { BasicField, MyInfoableFieldBase } from './base'

export interface CountryFieldBase extends MyInfoableFieldBase {
  fieldType: BasicField.Country
  fieldOptions: string[]
}
