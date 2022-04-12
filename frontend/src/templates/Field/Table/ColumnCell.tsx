import { useMemo } from 'react'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import { UseTableCellProps } from 'react-table'
import { FormControl } from '@chakra-ui/react'
import { get } from 'lodash'

import {
  BasicField,
  Column,
  ColumnDto,
  DropdownColumnBase,
  ShortTextColumnBase,
} from '~shared/types/field'

import { useIsMobile } from '~hooks/useIsMobile'
import {
  createDropdownValidationRules,
  createTextValidationRules,
} from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown'
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

const DropdownColumnCell = ({
  schema,
  inputName,
}: FieldColumnCellProps<DropdownColumnBase>) => {
  const rules = useMemo(() => createDropdownValidationRules(schema), [schema])

  return (
    <Controller
      name={inputName}
      rules={rules}
      defaultValue=""
      render={({ field }) => (
        <SingleSelect items={schema.fieldOptions} {...field} />
      )}
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
  const isMobile = useIsMobile()
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
      case BasicField.Dropdown:
        return (
          <DropdownColumnCell schema={columnSchema} inputName={inputName} />
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
      {
        // On desktop, errors are shown directly under the table field and should not
        // be shown in the individual column cells.
        isMobile ? (
          <FormErrorMessage>
            {get(errors, `${inputName}.message`)}
          </FormErrorMessage>
        ) : null
      }
    </FormControl>
  )
}
