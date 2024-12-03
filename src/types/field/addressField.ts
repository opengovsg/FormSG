import { AddressFieldBase, BasicField } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IAddressFieldSchema extends AddressFieldBase, IFieldSchema {
  fieldType: BasicField.Address
}
