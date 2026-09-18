import { CountryRegion } from '../../constants/countryRegion'
import { BasicField, MyInfoableFieldBase } from './base'

export interface CountryRegionFieldBase extends MyInfoableFieldBase {
  fieldType: BasicField.CountryRegion
  fieldOptions: CountryRegion[]
}
