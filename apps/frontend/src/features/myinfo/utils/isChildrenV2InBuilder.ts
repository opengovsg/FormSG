import {
  BasicField,
  ChildrenFieldVersion,
  FormResponseMode,
} from 'formsg-shared/types'

/**
 * Whether a children field should behave as v2 in the builder UI for a form of
 * the given response mode.
 *
 * Mirrors the server-side rule in `createFormField`: a children field is v2 if
 * it is already stamped `version: 2`, **or** the form is Multi-respondent
 * (where v2 is the default). The mode check matters because an MRF children
 * field is only stamped on save — without it the editor would briefly show the
 * v1 options (Secondary Race, Allow-Multiple) for a field that is really v2.
 */
export const isChildrenV2InBuilder = (
  field: { fieldType: BasicField; version?: ChildrenFieldVersion },
  responseMode?: FormResponseMode,
): boolean => {
  if (field.fieldType !== BasicField.Children) {
    return false
  }
  return (
    field.version === ChildrenFieldVersion.V2 ||
    responseMode === FormResponseMode.Multirespondent
  )
}
