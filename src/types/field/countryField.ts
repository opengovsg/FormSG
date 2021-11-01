import { BasicField, CountryFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface ICountryFieldSchema extends CountryFieldBase, IFieldSchema {
  fieldType: BasicField.Country
}
