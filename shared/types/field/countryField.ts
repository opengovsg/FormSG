import { BasicField, MyInfoableFieldBase } from './base'
import { CountryRegion } from '../../constants/countryRegion'

export interface CountryFieldBase extends MyInfoableFieldBase {
  fieldType: BasicField.Country
  fieldOptions: CountryRegion[]
}
