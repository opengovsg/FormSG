import { useMemo } from 'react'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import { UseTableCellProps } from 'react-table'
import { FormControl } from '@chakra-ui/react'
import { get } from 'lodash'

import {
  BasicField,
  Column,
  ColumnDto,
  ShortTextColumnBase,
} from '~shared/types/field'

import { createTextValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { TableFieldInputs } from '../types'

export interface ColumnCellProps
  extends UseTableCellProps<TableFieldInputs, string> {
  schemaId: string
  columnSchema: ColumnDto
}

export interface FieldColumnCellProps<T extends Column = Column> {
  schema: ColumnDto<T>
  /** Represents `{schemaId}.{rowIndex}.{columnId}` */
  inputName: `${string}.${number}.${string}`
}

const ShortTextColumnCell = ({
  schema,
  inputName,
}: FieldColumnCellProps<ShortTextColumnBase>) => {
  const rules = useMemo(() => createTextValidationRules(schema), [schema])

  const { control } = useFormContext<TableFieldInputs>()

  return (
    <Controller
      control={control}
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
  const { errors } = useFormState<TableFieldInputs>({ name: schemaId })

  const inputName = useMemo(
    () => `${schemaId}.${row.index}.${column.id}` as const,
    [column.id, row.index, schemaId],
  )

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
    <FormControl
      isRequired={columnSchema.required}
      isInvalid={!!get(errors, inputName)}
    >
      <FormLabel display={{ base: 'flex', md: 'none' }} color="secondary.700">
        {columnSchema.title}
      </FormLabel>
      {renderedColumnCell}
      <FormErrorMessage>{get(errors, `${inputName}.message`)}</FormErrorMessage>
    </FormControl>
  )
}
