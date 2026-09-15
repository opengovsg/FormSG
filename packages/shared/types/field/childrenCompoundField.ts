import { BasicField, MyInfoChildAttributes, MyInfoableFieldBase } from './base'

export interface ChildrenCompoundFieldBase extends MyInfoableFieldBase {
  fieldType: BasicField.Children
  // Stores the sub-field data.
  childrenSubFields?: MyInfoChildAttributes[]
  /**
   * @deprecated A children field collects exactly one child. Retained only
   * because existing form documents carry it; nothing reads it.
   */
  allowMultiple?: boolean
}

export enum MyInfoChildVaxxStatus {
  // Vaccinatinon requirement code 1M3D in the MyInfo API code tables
  ONEM3D_FULFILLED = 'MINIMUM VACCINATION REQUIREMENT FOR PRESCHOOL ADMISSION FULFILLED',
  ONEM3D_NOT_FULFILLED = 'MINIMUM VACCINATION REQUIREMENT FOR PRESCHOOL ADMISSION NOT FULFILLED',
  Unknown = 'UNKNOWN',
}
