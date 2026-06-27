import {
  BasicField,
  FieldBase,
  MyInfoChildAttributes,
  MyInfoableFieldBase,
} from './base'

/**
 * Schema version of a {@link ChildrenCompoundFieldBase}. See ADR-0001.
 * - `Legacy` (1, also the meaning of an absent `version`): exploded v3 storage,
 *   Secondary Race + Allow-Multiple available, `[MyInfo] Child N` numbering.
 * - `V2` (2): answerObject v4 storage, single child, unified identifier,
 *   per-child record type; Secondary Race + Allow-Multiple dropped.
 */
export enum ChildrenFieldVersion {
  Legacy = 1,
  V2 = 2,
}

export interface ChildrenCompoundFieldBase extends MyInfoableFieldBase {
  fieldType: BasicField.Children
  // Stores the sub-field data.
  childrenSubFields?: MyInfoChildAttributes[]
  // Whether the response should accept more than one children.
  // Default (undefined) is no.
  allowMultiple?: boolean
  // Selects v2 (answerObject v4) behaviour when set to `V2`. An absent value
  // means the legacy (v1) field. See ADR-0001.
  version?: ChildrenFieldVersion
}

/**
 * True only for a Children field stamped with {@link ChildrenFieldVersion.V2}.
 * An unversioned (or version-1) children field is legacy and returns false.
 */
export const isChildrenV2Field = (
  field: Pick<FieldBase, 'fieldType'> & { version?: ChildrenFieldVersion },
): field is ChildrenCompoundFieldBase =>
  field.fieldType === BasicField.Children &&
  field.version === ChildrenFieldVersion.V2

export enum MyInfoChildVaxxStatus {
  // Vaccinatinon requirement code 1M3D in the MyInfo API code tables
  ONEM3D_FULFILLED = 'MINIMUM VACCINATION REQUIREMENT FOR PRESCHOOL ADMISSION FULFILLED',
  ONEM3D_NOT_FULFILLED = 'MINIMUM VACCINATION REQUIREMENT FOR PRESCHOOL ADMISSION NOT FULFILLED',
  Unknown = 'UNKNOWN',
}
