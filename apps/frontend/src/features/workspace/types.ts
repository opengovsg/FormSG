/**
 * Filter options for forms displayed in the workspace page, when a filter is active.
 */
export enum FilterOption {
  AllForms = 'All forms',
  OpenForms = 'Open forms',
  ClosedForms = 'Closed forms',
  EmailForms = 'Email mode forms',
  StorageForms = 'Storage mode forms',
  MultiRespondentForms = 'Multi-respondent forms',
  // TODO [MRF-CUTOVER]: Remove after cutover. Shown only while the flag is on;
  // matches Encrypt (Storage mode) forms — the same forms that carry the
  // "Legacy" badge (see useResponseModeBadgeLabel).
  LegacyForms = 'Legacy forms',
}

export const filterOptionMap: Record<string, FilterOption> = {
  none: FilterOption.AllForms,
  open: FilterOption.OpenForms,
  closed: FilterOption.ClosedForms,
  storage: FilterOption.StorageForms,
  mrf: FilterOption.MultiRespondentForms,
  // TODO [MRF-CUTOVER]: Remove after cutover.
  legacy: FilterOption.LegacyForms,
}

export const filterOptionReverseMap: Record<FilterOption, string> = Object.keys(
  filterOptionMap,
).reduce(
  (acc, key) => {
    acc[filterOptionMap[key]] = key
    return acc
  },
  {} as Record<FilterOption, string>,
)
