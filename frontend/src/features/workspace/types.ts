/**
 * Sort order of forms displayed in the workspace page.
 */
export enum SortOption {
  LastUpdated = 'Last updated',
}

/**
 * Filter options for forms displayed in the workspace page, when a filter is active.
 */
export enum ActiveFilterOptions {
  OpenForms,
  ClosedForms,
}

export type FilterOptions = ActiveFilterOptions | undefined
