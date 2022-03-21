import { TableFieldSchema, TableRowValues } from '~templates/Field/types'

export const createTableRow = (schema: TableFieldSchema) => {
  return schema.columns.reduce<TableRowValues>((acc, c) => {
    acc[c._id] = ''
    return acc
  }, {})
}
