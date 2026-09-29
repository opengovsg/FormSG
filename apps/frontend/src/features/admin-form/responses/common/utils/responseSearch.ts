/**
 * The responses table and the CSV export search the same way but read different
 * values: the table matches what a cell renders, the export what it writes. The
 * match itself lives here so the two cannot answer differently.
 */

export const normaliseSearchQuery = (searchValue: string): string =>
  searchValue.trim().toLowerCase()

/** Columns the admin has not excluded from search. */
export const searchableColumnIds = (
  columnIds: string[],
  excludedColumnIds: string[],
): string[] =>
  columnIds.filter((columnId) => !excludedColumnIds.includes(columnId))

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
