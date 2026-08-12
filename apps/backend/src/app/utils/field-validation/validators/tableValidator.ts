import { TableAnswerV4 } from '@opengovsg/formsg-sdk'
import {
  BasicField,
  DropdownFieldBase,
  FormFieldWithId,
  ShortTextFieldBase,
  TableFieldDto,
} from 'formsg-shared/types'
import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ParsedClearFormFieldResponseV4 } from '../../../../types/api'
import {
  ITableFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'
import {
  ProcessedSingleAnswerResponse,
  ProcessedTableResponse,
} from '../../../modules/submission/submission.types'
import { createAnswerFieldFromColumn } from '../answerField.factory'
import { validateField, validateFieldV4 } from '..'

const ALLOWED_COLUMN_TYPES = [BasicField.ShortText, BasicField.Dropdown]

type TableValidator = ResponseValidator<ProcessedTableResponse>
type TableValidatorConstructor = (
  tableField: OmitUnusedValidatorProps<ITableFieldSchema>,
) => TableValidator

/**
 * Returns a validation function to check if the
 * response has less than the minimum number of rows specified.
 */
const makeMinimumRowsValidator: TableValidatorConstructor =
  (tableField) => (response) => {
    const { answerArray } = response
    const { minimumRows } = tableField

    return answerArray.length >= (minimumRows || 0)
      ? right(response)
      : left(`TableValidator:\tanswer has less than the minimum number of rows`)
  }

/**
 * Returns a validation function to check if addMoreRows is not set
 * and if so, whether the response has more than minimum number of rows.
 */
const makeAddMoreRowsValidator: TableValidatorConstructor =
  (tableField) => (response) => {
    const { answerArray } = response
    const { minimumRows, addMoreRows } = tableField

    if (addMoreRows) return right(response)
    return answerArray.length === (minimumRows || 0)
      ? right(response)
      : left(
          `TableValidator:\tanswer has extra rows even though addMoreRows is false`,
        )
  }

/**
 * Returns a validation function to check if the
 * response has more than the maximum number of rows specified.
 */
const makeMaximumRowsValidator: TableValidatorConstructor =
  (tableField) => (response) => {
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
const makeRowLengthValidator: TableValidatorConstructor =
  (tableField) => (response) => {
    const { answerArray } = response
    const { columns } = tableField

    return answerArray.every((row) => row.length === columns.length)
      ? right(response)
      : left(
          `TableValidator:\tanswer has rows with incorrect number of answers`,
        )
  }

/**
 * Returns a validation function that checks that the columns only have allowed types
 */

const makeColumnTypeValidator: TableValidatorConstructor =
  (tableField) => (response) => {
    const { columns } = tableField
    return columns.every((column) =>
      ALLOWED_COLUMN_TYPES.includes(column.columnType),
    )
      ? right(response)
      : left(`TableValidator:\tanswer has columns with non-allowed types`)
  }

/**
 * Returns a validation function that applies
 * the correct validator for each table cell.
 */

const makeTableCellValidator: TableValidatorConstructor =
  (tableField) => (response) => {
    const { answerArray, isVisible, _id } = response
    const { columns } = tableField
    const answerFieldColumns = columns.map((column) =>
      createAnswerFieldFromColumn(column),
    )

    return answerArray.every((row) => {
      return row.every((answer, i) => {
        const answerField = answerFieldColumns[i]
        const answerResponse: ProcessedSingleAnswerResponse = {
          answer,
          isVisible,
          fieldType: answerField.fieldType,
          _id,
          question: answerField.title,
        }

        return validateField(
          answerField._id || 'Table field validation',
          answerField,
          answerResponse,
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
    chain(makeColumnTypeValidator(tableField)),
    chain(makeTableCellValidator(tableField)),
  )

interface TableValidatorData {
  tableField: TableFieldDto
  formId: string
  isVisible: boolean
  isDisabled: boolean
}
// V4
// V4 table: answer = { [rowId]: { rowNum: number, value: { [colId]: string|number } } }

type TableResponseV4 = ParsedClearFormFieldResponseV4 & {
  fieldType: BasicField.Table
  answer: TableAnswerV4
}

const isTableFieldV4: ResponseValidator<
  ParsedClearFormFieldResponseV4,
  TableResponseV4
> = (response) => {
  if (response.fieldType !== BasicField.Table) {
    return left('TableValidatorV4.fieldTypeMismatch:\tfield type is not table')
  }
  return right(response as TableResponseV4)
}

// Helper to get the table answer as TableAnswerV4 (avoids AnswerV4 intersection issues)
const getTableAnswerV4 = (response: TableResponseV4): TableAnswerV4 =>
  response.answer as unknown as TableAnswerV4

const makeMinimumRowsValidatorV4: ResponseValidatorConstructor<
  TableValidatorData,
  TableResponseV4
> =
  ({ tableField }) =>
  (response) => {
    const answerRows = Object.values(getTableAnswerV4(response))
    const { minimumRows } = tableField

    return answerRows.length >= (minimumRows || 0)
      ? right(response)
      : left(
          `TableValidatorV4:\tanswer has less than the minimum number of rows`,
        )
  }

const makeAddMoreRowsValidatorV4: ResponseValidatorConstructor<
  TableValidatorData,
  TableResponseV4
> =
  ({ tableField }) =>
  (response) => {
    const answerRows = Object.values(getTableAnswerV4(response))
    const { minimumRows, addMoreRows } = tableField

    if (addMoreRows) return right(response)
    return answerRows.length === (minimumRows || 0)
      ? right(response)
      : left(
          `TableValidatorV4:\tanswer has extra rows even though addMoreRows is false`,
        )
  }

const makeMaximumRowsValidatorV4: ResponseValidatorConstructor<
  TableValidatorData,
  TableResponseV4
> =
  ({ tableField }) =>
  (response) => {
    const answerRows = Object.values(getTableAnswerV4(response))
    const { maximumRows } = tableField

    if (!maximumRows) return right(response)

    return answerRows.length <= maximumRows
      ? right(response)
      : left(
          `TableValidatorV4:\tanswer has more than the maximum number of rows`,
        )
  }

const makeRowLengthValidatorV4: ResponseValidatorConstructor<
  TableValidatorData,
  TableResponseV4
> =
  ({ tableField }) =>
  (response) => {
    const answerRows = Object.values(getTableAnswerV4(response))
    const { columns } = tableField

    return answerRows.every(
      (row) => Object.keys(row.value).length === columns.length,
    )
      ? right(response)
      : left(
          `TableValidatorV4:\tanswer has rows with incorrect number of answers`,
        )
  }

const makeColumnTypeValidatorV4: ResponseValidatorConstructor<
  TableValidatorData,
  TableResponseV4
> =
  ({ tableField }) =>
  (response) => {
    const { columns } = tableField
    return columns.every((column) =>
      ALLOWED_COLUMN_TYPES.includes(column.columnType),
    )
      ? right(response)
      : left(`TableValidatorV4:\tanswer has columns with non-allowed types`)
  }

const makeTableCellValidatorV4: ResponseValidatorConstructor<
  TableValidatorData,
  TableResponseV4
> =
  ({ tableField, formId, isVisible, isDisabled }) =>
  (response) => {
    // Sort rows by rowNum for consistent ordering
    const answerRows = Object.values(getTableAnswerV4(response)).sort(
      (a, b) => a.rowNum - b.rowNum,
    )
    const { columns } = tableField

    return answerRows.every((row) => {
      // Iterate columns in canonical order and look up each cell by columnId.
      // Do not rely on Object.values(row.value) preserving column order.
      return columns.every((col) => {
        const answer = String(row.value[col._id])
        // Each cell is validated as a standalone V4 single-answer response
        // of the column's field type.
        const answerResponse: ParsedClearFormFieldResponseV4 = {
          fieldType: col.columnType,
          answer: { value: answer },
          question: col.title,
          provenance: {},
        }

        if (col.columnType === BasicField.Dropdown) {
          const formField = {
            ...col,
            fieldType: col.columnType,
            description: '',
            disabled: isDisabled,
            _id: '',
          } as FormFieldWithId<DropdownFieldBase>

          return validateFieldV4({
            formId,
            formField,
            response: answerResponse,
            isVisible,
          }).isOk()
        } else if (col.columnType === BasicField.ShortText) {
          const formField = {
            ...col,
            fieldType: col.columnType,
            description: '',
            disabled: isDisabled,
            _id: '',
          } as FormFieldWithId<ShortTextFieldBase>

          return validateFieldV4({
            formId,
            formField,
            response: answerResponse,
            isVisible,
          }).isOk()
        }

        return false
      })
    })
      ? right(response)
      : left(`TableValidatorV4:\tanswer failed field validation`)
  }

export const constructTableValidatorV4: ResponseValidatorConstructor<
  TableValidatorData,
  ParsedClearFormFieldResponseV4,
  TableResponseV4
> = (tableFieldProperties) =>
  flow(
    isTableFieldV4,
    chain(makeMinimumRowsValidatorV4(tableFieldProperties)),
    chain(makeAddMoreRowsValidatorV4(tableFieldProperties)),
    chain(makeMaximumRowsValidatorV4(tableFieldProperties)),
    chain(makeRowLengthValidatorV4(tableFieldProperties)),
    chain(makeColumnTypeValidatorV4(tableFieldProperties)),
    chain(makeTableCellValidatorV4(tableFieldProperties)),
  )
