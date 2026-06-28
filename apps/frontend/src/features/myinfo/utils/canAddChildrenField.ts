import { FormResponseMode } from 'formsg-shared/types'

/**
 * Whether the MyInfo Children field may be offered in the builder.
 *
 * - Encrypt (Storage) mode: available with the children beta flag (today's
 *   behaviour).
 * - Multi-respondent mode: available only when children-v2 is enabled, since
 *   the definitive children field lives in the unified-modes / answerObject-v4
 *   world and its MRF submission path is gated behind the children-v2 rollout
 *   (slice 08). Without v2 it stays hidden so admins can't create a form whose
 *   children submission path isn't ready.
 * - All other modes (e.g. Email): not supported.
 */
export const canAddChildrenField = ({
  hasChildrenBetaFlag,
  responseMode,
  isChildrenV2Enabled,
}: {
  hasChildrenBetaFlag: boolean
  responseMode?: FormResponseMode
  isChildrenV2Enabled: boolean
}): boolean => {
  if (!hasChildrenBetaFlag) {
    return false
  }
  if (responseMode === FormResponseMode.Encrypt) {
    return true
  }
  if (responseMode === FormResponseMode.Multirespondent) {
    return isChildrenV2Enabled
  }
  return false
}
