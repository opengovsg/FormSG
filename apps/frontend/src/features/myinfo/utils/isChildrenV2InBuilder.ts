import { BasicField, ChildrenFieldVersion } from 'formsg-shared/types'

/**
 * Whether a children field should behave as v2 in the builder UI — i.e. it is
 * stamped `version: 2` (ADR-0001). v2 drops Secondary Race + Allow-Multiple and
 * uses the new field description.
 */
export const isChildrenV2InBuilder = (field: {
  fieldType: BasicField
  version?: ChildrenFieldVersion
}): boolean =>
  field.fieldType === BasicField.Children &&
  field.version === ChildrenFieldVersion.V2
