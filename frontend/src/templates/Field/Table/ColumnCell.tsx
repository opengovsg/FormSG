import { useMemo } from 'react'
import { Controller, FieldError, useFormContext } from 'react-hook-form'
import { UseTableCellProps } from 'react-table'
import { FormControl } from '@chakra-ui/react'
import { get } from 'lodash'

import { BasicField, Column, ShortTextColumnBase } from '~shared/types/field'

import { createShortTextValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Input from '~components/Input'

import { ColumnWithId } from './TableField'

export interface ColumnCellProps
  extends UseTableCellProps<Record<string, unknown>, string> {
  schemaId: string
  columnSchema: ColumnWithId
}

export interface FieldColumnCellProps<T = Column> {
  schema: ColumnWithId<T>
  inputName: string
}

const ShortTextColumnCell = ({
  schema,
  inputName,
}: FieldColumnCellProps<ShortTextColumnBase>) => {
  const rules = useMemo(() => createShortTextValidationRules(schema), [schema])

  return (
    <Controller
      name={inputName}
      rules={rules}
      render={({ field }) => <Input aria-labelledby={schema._id} {...field} />}
    />
  )
}

/**
 * Renderer for each column cell in the table schema.
 */
export const ColumnCell = ({
  schemaId,
  row,
  column,
  columnSchema,
}: ColumnCellProps): JSX.Element => {
  const {
    formState: { errors },
  } = useFormContext()

  const inputName = useMemo(
    () => `${schemaId}.${row.index}.${column.id}`,
    [column.id, row.index, schemaId],
  )

  const cellError: FieldError | undefined = get(errors, inputName)

  const renderedColumnCell = useMemo(() => {
    switch (columnSchema.columnType) {
      case BasicField.ShortText:
        return (
          <ShortTextColumnCell schema={columnSchema} inputName={inputName} />
        )
      default:
        return null
    }
  }, [columnSchema, inputName])

  return (
    <FormControl isRequired={columnSchema.required} isInvalid={!!cellError}>
      {renderedColumnCell}
      <FormErrorMessage>{cellError?.message}</FormErrorMessage>
    </FormControl>
  )
}
