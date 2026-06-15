import { useTranslation } from 'react-i18next'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types'

/**
 * Resolves the badge label shown for a form's response mode.
 *
 * During the MRF cutover experiment, Storage mode (Encrypt) forms are labelled
 * "Legacy" and Multi-respondent forms carry no badge at all. Every other mode
 * keeps its existing label. When the flag is off, all modes use their existing
 * label.
 *
 * TODO [MRF-CUTOVER]: Remove this hook after cutover. Call sites should then
 * read `meta.responseModeText.${responseMode}` directly again.
 *
 * @returns the badge label, or `null` when no badge should be shown.
 */
export const useResponseModeBadgeLabel = (
  responseMode?: FormResponseMode,
): string | null => {
  const { t } = useTranslation()
  const isMrfCutoverEnabled = useFeatureIsOn(featureFlags.mrfCutover)

  if (!responseMode) return null

  if (isMrfCutoverEnabled) {
    if (responseMode === FormResponseMode.Multirespondent) return null
    if (responseMode === FormResponseMode.Encrypt) return 'Legacy'
  }

  return t(`features.adminForm.meta.responseModeText.${responseMode}`)
}
