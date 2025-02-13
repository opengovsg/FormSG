import { BasicField, FieldBase } from './base'

export interface AddressCompoundFieldBase extends FieldBase {
  fieldType: BasicField.Address
  addressSubFields?: AddressAttributes // 1 address for the field (not allow multiple)
}

export type AddressAttributes = {
  postalCode: string
  blockNumber: string
  streetName: string
  buildingName: string
  levelNumber: string
  unitNumber: string
}
