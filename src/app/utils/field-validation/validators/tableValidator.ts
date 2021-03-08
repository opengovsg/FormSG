import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import { unzip } from 'lodash'

import {
  BasicField,
  IColumnSchema,
  ITableFieldSchema,
} from '../../../../types/field'
import { ResponseValidator } from '../../../../types/field/utils/validation'
import { ProcessedTableResponse } from '../../../modules/submission/submission.types'
import { validateField } from '..'

type TableValidator = ResponseValidator<ProcessedTableResponse>
type TableValidatorConstructor = (
  tableField: ITableFieldSchema,
) => TableValidator

/**
 * Returns a validation function to check if the
 * response has less than the minimum number of rows specified.
 */
const makeMinimumRowsValidator: TableValidatorConstructor = (tableField) => (
  response,
) => {
  const { answerArray } = response
  const { minimumRows } = tableField

  return answerArray.length >= minimumRows
    ? right(response)
    : left(`TableValidator:\tanswer has less than the minimum number of rows`)
}

/**
 * Returns a validation function to check if addMoreRows is not set
 * and if so, whether the response has more than minimum number of rows.
 */
const makeAddMoreRowsValidator: TableValidatorConstructor = (tableField) => (
  response,
) => {
  const { answerArray } = response
  const { minimumRows, addMoreRows } = tableField

  if (addMoreRows) return right(response)
  return answerArray.length === minimumRows
    ? right(response)
    : left(
        `TableValidator:\tanswer has extra rows even though addMoreRows is false`,
      )
}

/**
 * Returns a validation function to check if the
 * response has more than the maximum number of rows specified.
 */
const makeMaximumRowsValidator: TableValidatorConstructor = (tableField) => (
  response,
) => {
  const { answerArray } = response
  const { maximumRows } = tableField

  if (!maximumRows) return right(response)

  return answerArray.length <= maximumRows
    ? right(response)
    : left(`TableValidator:\tanswer has more than the maximum number of rows`)
}

/**
 * Returns a validation function to check if the
 * response has the correct number of answers for each row.
 */
const makeRowLengthValidator: TableValidatorConstructor = (tableField) => (
  response,
) => {
  const { answerArray } = response
  const { columns } = tableField

  return answerArray.every((row) => row.length === columns.length)
    ? right(response)
    : left(`TableValidator:\tanswer has rows with incorrect number of answers`)
}

/**
 * Returns a validation function that applies
 * the correct validator for each column based on its type.
 */
const makeColumnValidator: TableValidatorConstructor = (tableField) => (
  response,
) => {
  const { answerArray, isVisible, _id } = response
  const { columns } = tableField

  const cols = unzip(answerArray)
  return columns.every((columnFormField, i) => {
    return cols[i].every((answer) => {
      if (
        columnFormField.columnType !== BasicField.ShortText &&
        columnFormField.columnType !== BasicField.Dropdown
      ) {
        return false
      }

      // Inject properties so that columnField can be passed into validateField
      type ColumnFormFieldWithProperties<T> = T & {
        getQuestion: { (): string }
        description: string
        disabled: boolean
        fieldType: BasicField
      }

      const columnField = columnFormField
      ;(columnField as ColumnFormFieldWithProperties<IColumnSchema>).disabled = false
      ;(columnField as ColumnFormFieldWithProperties<IColumnSchema>).description =
        'some description'
      ;(columnField as ColumnFormFieldWithProperties<IColumnSchema>).fieldType =
        columnFormField.columnType
      ;(columnField as ColumnFormFieldWithProperties<IColumnSchema>).getQuestion = () =>
        'some question'

      const columnResponse = {
        answer,
        isVisible,
        fieldType: columnFormField.columnType,
        _id,
        question: columnFormField.title,
      }
      return validateField(
        columnField._id,
        columnField as ColumnFormFieldWithProperties<IColumnSchema>,
        columnResponse,
      ).isOk()
    })
  })
    ? right(response)
    : left(`TableValidator:\tanswer failed field validation`)
}

/**
 * Returns a validation function for a table field when called.
 */
export const constructTableValidator: TableValidatorConstructor = (
  tableField,
) =>
  flow(
    makeMinimumRowsValidator(tableField),
    chain(makeAddMoreRowsValidator(tableField)),
    chain(makeMaximumRowsValidator(tableField)),
    chain(makeRowLengthValidator(tableField)),
    chain(makeColumnValidator(tableField)),
  )
