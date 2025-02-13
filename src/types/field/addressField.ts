import { AddressCompoundFieldBase, BasicField } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IAddressCompoundFieldSchema
  extends AddressCompoundFieldBase,
    IFieldSchema {
  fieldType: BasicField.Address
}
