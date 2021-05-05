import { BasicField, IColumnSchema } from 'src/types'

/**
 * Return type of createAnswerFieldFromColumn().
 * This is a subset of IFieldSchema (note that the
 * fieldType is restricted) and allows the result to be
 * passed into validateField().
 * */
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
  const columnField = {
    // Convert mongoose document to object first,
    // otherwise the values will not be correctly spread
    ...column.toObject(),
    disabled: false,
    description: 'some description',
    get fieldType() {
      return column.columnType
    },
    getQuestion() {
      return 'some question'
    },
  }
  return columnField as ColumnWithFieldProperties
}
