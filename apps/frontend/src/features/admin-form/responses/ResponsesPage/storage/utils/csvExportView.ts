import {
  SavedViewColumnFilter,
  SavedViewSortDirection,
} from 'formsg-shared/types'

import {
  CSV_MRF_PENDING_RESPONSE_AT_COLUMN_ID,
  CSV_MRF_WORKFLOW_STATUS_COLUMN_ID,
  CSV_PAYMENT_COLUMN_IDS,
  MRF_PENDING_RESPONSE_AT_LABEL,
  MRF_WORKFLOW_STATUS_LABEL,
} from '~features/admin-form/responses/constants'

/**
 * Ids the responses table gives its own columns. Every other sortable column id
 * is a form field id, which is how a record is keyed once decrypted.
 */
export const EXPORT_RESPONSE_ID_COLUMN_ID = 'refNo'
export const EXPORT_RESPONSE_NUMBER_COLUMN_ID = 'number'
export const EXPORT_TIMESTAMP_COLUMN_ID = 'submissionTime'
// These were derived from the column headers before they were given ids, and
// saved views store them, so they keep those values.
export const EXPORT_WORKFLOW_STATUS_COLUMN_ID = MRF_WORKFLOW_STATUS_LABEL
export const EXPORT_PENDING_RESPONSE_AT_COLUMN_ID =
  MRF_PENDING_RESPONSE_AT_LABEL
export const EXPORT_PAYER_EMAIL_COLUMN_ID = 'Email'
export const EXPORT_PAID_AMOUNT_COLUMN_ID = 'Paid Amount (S$)'
export const EXPORT_FEES_COLUMN_ID = 'Fees (S$)'
export const EXPORT_PAYOUT_DATE_COLUMN_ID = 'Payout Date'

/**
 * The table column each reserved CSV column shows the same value as, so hiding
 * one in the table drops the other from the export. CSV columns missing here
 * have no table counterpart and are always exported.
 */
export const TABLE_COLUMN_ID_BY_CSV_COLUMN_ID: Record<string, string> = {
  [CSV_MRF_WORKFLOW_STATUS_COLUMN_ID]: EXPORT_WORKFLOW_STATUS_COLUMN_ID,
  [CSV_MRF_PENDING_RESPONSE_AT_COLUMN_ID]: EXPORT_PENDING_RESPONSE_AT_COLUMN_ID,
  [CSV_PAYMENT_COLUMN_IDS.email]: EXPORT_PAYER_EMAIL_COLUMN_ID,
  [CSV_PAYMENT_COLUMN_IDS.amount]: EXPORT_PAID_AMOUNT_COLUMN_ID,
  [CSV_PAYMENT_COLUMN_IDS.transactionFee]: EXPORT_FEES_COLUMN_ID,
  [CSV_PAYMENT_COLUMN_IDS.payoutDate]: EXPORT_PAYOUT_DATE_COLUMN_ID,
}

const TABLE_ONLY_COLUMN_IDS = new Set([
  EXPORT_RESPONSE_NUMBER_COLUMN_ID,
  EXPORT_TIMESTAMP_COLUMN_ID,
  EXPORT_WORKFLOW_STATUS_COLUMN_ID,
  EXPORT_PENDING_RESPONSE_AT_COLUMN_ID,
  EXPORT_PAYER_EMAIL_COLUMN_ID,
  EXPORT_PAID_AMOUNT_COLUMN_ID,
  EXPORT_FEES_COLUMN_ID,
  EXPORT_PAYOUT_DATE_COLUMN_ID,
])

/**
 * Whether a decrypted record can answer the column: a form field, or the
 * response id. The others hold values only the table derives.
 */
export const isRecordColumnId = (columnId: string): boolean =>
  !TABLE_ONLY_COLUMN_IDS.has(columnId)

/** What the responses table is showing, carried over to the export. */
export interface CsvExportView {
  /**
   * The table's column filters, for an export past what the table matched
   * itself. Only form fields and the response id can be matched here.
   */
  columnFilters?: SavedViewColumnFilter[]
  sortColumnId?: string
  sortDirection?: SavedViewSortDirection
  hiddenColumnIds?: string[]
  /**
   * Every column the table has, shown or not. A CSV column whose table
   * counterpart is missing from it is dropped, as the table does not show it.
   */
  tableColumnIds?: string[]
}

/**
 * Whether the table shows the column, hidden ones and ones it does not have
 * both counting as not shown. Without the table's column list, as in an export
 * that did not come from the table, only the hidden ones count.
 */
export const isTableColumnShown = (
  { hiddenColumnIds, tableColumnIds }: CsvExportView,
  columnId: string,
): boolean =>
  !hiddenColumnIds?.includes(columnId) &&
  (!tableColumnIds || tableColumnIds.includes(columnId))

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
