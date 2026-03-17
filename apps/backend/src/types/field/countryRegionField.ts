import { BasicField, CountryRegionFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface ICountryRegionFieldSchema
  extends CountryRegionFieldBase, IFieldSchema {
  fieldType: BasicField.CountryRegion
}
