import { SavedViewSortDirection } from 'formsg-shared/types'

/**
 * Ids the responses table gives its own columns. Every other sortable column id
 * is a form field id, which is how a record is keyed once decrypted.
 */
export const EXPORT_RESPONSE_ID_COLUMN_ID = 'refNo'
export const EXPORT_RESPONSE_NUMBER_COLUMN_ID = 'number'
export const EXPORT_TIMESTAMP_COLUMN_ID = 'submissionTime'

/** What the responses table is showing, carried over to the export. */
export interface CsvExportView {
  sortColumnId?: string
  sortDirection?: SavedViewSortDirection
  hiddenColumnIds?: string[]
}

/** The response number counts down from the newest, so it orders by date. */
export const isTimestampColumnId = (columnId: string): boolean =>
  columnId === EXPORT_TIMESTAMP_COLUMN_ID ||
  columnId === EXPORT_RESPONSE_NUMBER_COLUMN_ID

export const directionFactor = (direction?: SavedViewSortDirection): number =>
  direction === SavedViewSortDirection.Ascending ? 1 : -1

// Case-insensitive, and digits compare as numbers, so 2 sorts before 10.
const collator = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base',
})

export const compareAnswers = (a: string, b: string): number =>
  collator.compare(a, b)
