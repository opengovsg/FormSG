import { MyInfoAttribute } from 'formsg-shared/types'

import { ParsedClearFormFieldResponsesV4 } from 'src/types/api'

/**
 * Whether a field's answer passed MyInfo hash verification: regular MyInfo
 * fields verify under their plain field id, Children under composite
 * per-child hash keys prefixed by the field id. The single membership rule
 * behind both verified-ness signals (myInfoReadOnlyFields and
 * provenance.myinfoVerified), so the two cannot drift.
 */
export const isMyInfoVerifiedFieldId = (
  fieldId: string,
  verifiedKeys: ReadonlySet<string>,
): boolean => {
  if (verifiedKeys.has(fieldId)) return true
  const childKeyPrefix = `${MyInfoAttribute.ChildrenBirthRecords}.${fieldId}.`
  for (const key of verifiedKeys) {
    if (key.startsWith(childKeyPrefix)) return true
  }
  return false
}

/**
 * Reuses successful MyInfo verification to select submitted field IDs,
 * Children included via their composite child keys.
 */
export const resolveMrfMyInfoReadOnlyFields = ({
  verifiedKeys,
  responses,
}: {
  verifiedKeys: ReadonlySet<string>
  responses: ParsedClearFormFieldResponsesV4
}): string[] =>
  Object.keys(responses).filter((id) =>
    isMyInfoVerifiedFieldId(id, verifiedKeys),
  )
