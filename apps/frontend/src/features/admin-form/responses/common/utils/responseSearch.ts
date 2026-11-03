import { SavedViewColumnFilter } from 'formsg-shared/types'

/**
 * The responses table and the CSV export search the same way but read different
 * values: the table matches what a cell renders, the export what it writes. The
 * match itself lives here so the two cannot answer differently.
 */

export const normaliseSearchQuery = (searchValue: string): string =>
  searchValue.trim().toLowerCase()

/** A row matches when any searchable value contains the query. */
export const matchesSearchQuery = (
  values: (string | undefined)[],
  normalisedQuery: string,
): boolean => {
  if (!normalisedQuery) return true
  return values.some(
    (value) =>
      typeof value === 'string' &&
      value.toLowerCase().includes(normalisedQuery),
  )
}

const matchesColumnFilter = (
  value: string | undefined,
  filter: SavedViewColumnFilter,
): boolean =>
  'values' in filter
    ? value !== undefined && filter.values.includes(value)
    : matchesSearchQuery([value], normaliseSearchQuery(filter.text))

/**
 * A row matches when every filtered column's value contains its filter text,
 * or is one of its listed values, so each filter narrows the rows.
 */
export const matchesColumnFilters = (
  getColumnValue: (columnId: string) => string | undefined,
  columnFilters: SavedViewColumnFilter[],
): boolean =>
  columnFilters.every((filter) =>
    matchesColumnFilter(getColumnValue(filter.columnId), filter),
  )
