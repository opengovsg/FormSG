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

/**
 * A row matches when every filtered column's value contains its filter text,
 * so each filter narrows the rows.
 */
export const matchesColumnFilters = (
  getColumnValue: (columnId: string) => string | undefined,
  columnFilters: SavedViewColumnFilter[],
): boolean =>
  columnFilters.every(({ columnId, text }) =>
    matchesSearchQuery([getColumnValue(columnId)], normaliseSearchQuery(text)),
  )
