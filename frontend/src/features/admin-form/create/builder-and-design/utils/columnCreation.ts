import cuid from 'cuid'

import { BasicField, ColumnDto, ShortTextColumnBase } from '~shared/types'

const TEMP_COLUMN_ID_PREFIX = 'tempColumnId_'

export const createTemporaryColumnId = (): string => {
  return TEMP_COLUMN_ID_PREFIX + cuid()
}

export const isTemporaryColumnId = (columnId: string): boolean => {
  return columnId.startsWith(TEMP_COLUMN_ID_PREFIX)
}

export const createShortTextColumn = (): ColumnDto<ShortTextColumnBase> => {
  return {
    columnType: BasicField.ShortText,
    required: true,
    title: 'Text Field',
    _id: createTemporaryColumnId(),
    ValidationOptions: {
      customVal: null,
      selectedValidation: null,
    },
  }
}
