import { BasicField, CountryRegionFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface ICountryRegionFieldSchema
  extends CountryRegionFieldBase,
    IFieldSchema {
  fieldType: BasicField.CountryRegion
}
