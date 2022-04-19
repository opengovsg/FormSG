import { BasicField, MyInfoableFieldBase } from './base'
import { Country } from '../../constants/countries'

export interface CountryFieldBase extends MyInfoableFieldBase {
  fieldType: BasicField.Country
  fieldOptions: Country[]
}
