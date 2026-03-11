import { AddressCompoundFieldBase, BasicField } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface IAddressCompoundFieldSchema
  extends AddressCompoundFieldBase, IFieldSchema {
  fieldType: BasicField.Address
}
