import { FormResponseMode } from 'formsg-shared/types'

/**
 * Whether the MyInfo Children field may be offered in the builder.
 *
 * - **Encrypt (Storage)** mode: available with the children beta flag (today's
 *   behaviour). v1 vs v2 there is governed separately by the `children-v2`
 *   GrowthBook flag at create time.
 * - **Multi-respondent** mode: available with the children beta flag —
 *   children-v2 is the **default** here (the definitive children field lives in
 *   the unified-modes / answerObject-v4 world), so no extra flag is needed.
 * - All other modes (e.g. Email): not supported.
 */
export const canAddChildrenField = ({
  hasChildrenBetaFlag,
  responseMode,
}: {
  hasChildrenBetaFlag: boolean
  responseMode?: FormResponseMode
}): boolean => {
  if (!hasChildrenBetaFlag) {
    return false
  }
  return (
    responseMode === FormResponseMode.Encrypt ||
    responseMode === FormResponseMode.Multirespondent
  )
}
