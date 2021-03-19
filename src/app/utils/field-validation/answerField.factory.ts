import { BasicField, IColumnSchema } from '../../../types'

type ColumnWithFieldProperties = IColumnSchema & {
  getQuestion: { (): string }
  description: string
  disabled: boolean
  fieldType: BasicField.ShortText | BasicField.Dropdown
}

/**
 * Takes a table field column and generates a form field by
 * filling in the missing attributes.
 * */
export const createAnswerFieldFromColumn = (
  column: IColumnSchema,
): ColumnWithFieldProperties => {
  const columnField = column
  ;(columnField as ColumnWithFieldProperties).disabled = false
  ;(columnField as ColumnWithFieldProperties).description = 'some description'
  ;(columnField as ColumnWithFieldProperties).fieldType = column.columnType
  ;(columnField as ColumnWithFieldProperties).getQuestion = () =>
    'some question'
  return columnField as ColumnWithFieldProperties
}
