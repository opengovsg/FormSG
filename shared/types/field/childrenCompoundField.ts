import {
  BasicField,
  MyInfoChildAttributes,
  MyInfoableFieldBase,
} from './base'

export interface ChildrenCompoundFieldBase extends MyInfoableFieldBase {
  fieldType: BasicField.Children
  // Stores the sub-field data.
  childrenSubFields?: MyInfoChildAttributes[]
  // Whether the response should accept more than one children.
  // Default (undefined) is no.
  allowMultiple?: boolean
}

export enum MyInfoChildVaxxStatus {
  // Vaccinatinon requirement code 1M3D in the MyInfo API code tables
  ONEM3D = 'MINIMUM VACCINATION REQUIREMENT FOR PRESCHOOL ADMISSION FULFILLED',
  Unknown = 'UNKNOWN',
}
