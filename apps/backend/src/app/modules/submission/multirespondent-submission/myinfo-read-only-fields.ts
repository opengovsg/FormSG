import { ParsedClearFormFieldResponsesV4 } from 'src/types/api'

/**
 * Reuses successful MyInfo verification to select submitted field IDs.
 * Composite child keys are handled separately through response provenance.
 */
export const resolveMrfMyInfoReadOnlyFields = ({
  verifiedKeys,
  responses,
}: {
  verifiedKeys: ReadonlySet<string>
  responses: ParsedClearFormFieldResponsesV4
}): string[] => Object.keys(responses).filter((id) => verifiedKeys.has(id))
