import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { TFunction } from 'i18next'

import { featureFlags } from 'formsg-shared/constants'

import { FilterOption } from '../types'

export const FILTER_OPTIONS: FilterOption[] = [
  FilterOption.AllForms,
  FilterOption.OpenForms,
  FilterOption.ClosedForms,
  FilterOption.StorageForms,
  FilterOption.MultiRespondentForms,
  FilterOption.EmailForms,
]

// TODO [MRF-CUTOVER]: Remove after cutover. During the experiment the
// response-mode options (Storage / Multi-respondent / Email) are replaced by a
// single "Legacy" option, so admins aren't shown the mode distinctions the
// cutover hides everywhere else. "Legacy" matches Encrypt (Storage mode) forms.
const CUTOVER_FILTER_OPTIONS: FilterOption[] = [
  FilterOption.AllForms,
  FilterOption.OpenForms,
  FilterOption.ClosedForms,
  FilterOption.LegacyForms,
]

/**
 * Returns the filter options to show in the dashboard filter menu. While the
 * MRF cutover flag is on, the response-mode options are replaced by a single
 * "Legacy" option.
 *
 * TODO [MRF-CUTOVER]: Remove after cutover; consumers should use
 * `FILTER_OPTIONS` directly again.
 */
export const useDashboardFilterOptions = (): FilterOption[] => {
  const isMrfCutoverEnabled = useFeatureIsOn(featureFlags.mrfCutover)
  if (!isMrfCutoverEnabled) return FILTER_OPTIONS
  return CUTOVER_FILTER_OPTIONS
}

/**
 * Resolves the label shown for a filter option. Only the cutover-only "Legacy"
 * option is translated; every other option renders its enum value as before
 * (the value doubles as the menu/URL key, which must stay stable).
 *
 * TODO [MRF-CUTOVER]: Remove after cutover.
 */
export const getFilterOptionLabel = (
  option: FilterOption,
  t: TFunction,
): string =>
  option === FilterOption.LegacyForms
    ? t('features.workspace.search.legacyFilterLabel')
    : option
