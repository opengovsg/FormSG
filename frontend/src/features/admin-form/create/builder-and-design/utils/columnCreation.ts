import cuid from 'cuid'

const TEMP_COLUMN_ID_PREFIX = 'tempColumnId_'

export const createTemporaryColumnId = (): string => {
  return TEMP_COLUMN_ID_PREFIX + cuid()
}

export const isTemporaryColumnId = (columnId: string): boolean => {
  return columnId.startsWith(TEMP_COLUMN_ID_PREFIX)
}
