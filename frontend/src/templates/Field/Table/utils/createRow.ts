import { TableFieldSchema, TableRowFieldValue } from '~templates/Field/types'

export const createTableRow = (schema: TableFieldSchema) => {
  return schema.columns.reduce<TableRowFieldValue>((acc, c) => {
    acc[c._id] = ''
    return acc
  }, {})
}
