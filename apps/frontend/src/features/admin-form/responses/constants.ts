// TODO(#8204) Use text labels in i18n files
export const MRF_RESPONSE_TIMESTAMP_LABEL = 'Response timestamp'
export const MRF_PENDING_RESPONSE_AT_LABEL = 'Pending response at'
export const MRF_WORKFLOW_STATUS_LABEL = 'Workflow status'
export const MRF_REMINDERS_LABEL = 'Reminders'
export const MRF_STATUS_TRACKING_LABEL = 'Status tracking link'

export const SIGNATURE_ADDED_TEXT = 'Signature captured.'

// Reserved pseudo-field ids CsvRecord injects into every CSV record. Listed
// in canonical column order so the generator can pin them to the front of
// the export regardless of which record introduced them.
export const CSV_DOWNLOAD_STATUS_COLUMN_ID = '000000000000000000000000'
export const CSV_MRF_WORKFLOW_STATUS_COLUMN_ID = '000000000000000000010001'
export const CSV_MRF_PENDING_RESPONSE_AT_COLUMN_ID = '000000000000000000010002'
export const CSV_FIXED_COLUMN_IDS = [
  CSV_DOWNLOAD_STATUS_COLUMN_ID,
  CSV_MRF_WORKFLOW_STATUS_COLUMN_ID,
  CSV_MRF_PENDING_RESPONSE_AT_COLUMN_ID,
]

export const TABLE_DECRYPTION_LIMIT = 10000

export const TABLE_ROW_RENDER_CHUNK = 50

export const CSV_BUFFER_MAX_RESPONSES = 10000

export const TABLE_DECRYPTION_PUBLISH_INTERVAL_MS = 250
