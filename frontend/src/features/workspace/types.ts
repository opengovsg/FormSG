/**
 * Filter options for forms displayed in the workspace page, when a filter is active.
 */
export enum FilterOption {
  AllForms = 'All forms',
  OpenForms = 'Open forms',
  ClosedForms = 'Closed forms',
  EmailForms = 'Email-mode forms',
  StorageForms = 'Storage-mode forms',
  MultiRespondentForms = 'Multi-respondent forms',
}

export const filterOptionMap: Record<string, FilterOption> = {
  none: FilterOption.AllForms,
  open: FilterOption.OpenForms,
  closed: FilterOption.ClosedForms,
  email: FilterOption.EmailForms,
  storage: FilterOption.StorageForms,
  mrf: FilterOption.MultiRespondentForms,
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
