import { useFeatureIsOn } from '@growthbook/growthbook-react'

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
// response-mode filters are hidden so admins aren't shown the
// Storage/Multi-respondent/Email mode distinctions.
const CUTOVER_HIDDEN_FILTER_OPTIONS: FilterOption[] = [
  FilterOption.StorageForms,
  FilterOption.MultiRespondentForms,
  FilterOption.EmailForms,
]

/**
 * Returns the filter options to show in the dashboard filter menu. While the
 * MRF cutover flag is on, the response-mode options are hidden.
 *
 * TODO [MRF-CUTOVER]: Remove after cutover; consumers should use
 * `FILTER_OPTIONS` directly again.
 */
export const useDashboardFilterOptions = (): FilterOption[] => {
  const isMrfCutoverEnabled = useFeatureIsOn(featureFlags.mrfCutover)
  if (!isMrfCutoverEnabled) return FILTER_OPTIONS
  return FILTER_OPTIONS.filter(
    (option) => !CUTOVER_HIDDEN_FILTER_OPTIONS.includes(option),
  )
}
