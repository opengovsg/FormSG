/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useCallback, useMemo } from 'react'
import {
  Controller,
  ControllerRenderProps,
  FieldError,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { BiPlus } from 'react-icons/bi'
import { useTable, UseTableCellProps } from 'react-table'
import {
  FormControl,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react'
import { get, times } from 'lodash'
import { Merge } from 'type-fest'

import {
  BasicField,
  Column,
  FormFieldWithId,
  ShortTextColumnBase,
  TableFieldBase,
} from '~shared/types/field'

import { createShortTextValidationRules } from '~utils/fieldValidation'
import Button from '~components/Button'
import { FormErrorMessage } from '~components/FormControl/FormErrorMessage/FormErrorMessage'
import Input from '~components/Input'

import { BaseFieldProps } from '../FieldContainer'

import { TableFieldContainer } from './TableFieldContainer'

type ColumnWithId<T = Column> = T & { _id: string }
export type TableFieldSchema = Merge<
  FormFieldWithId<TableFieldBase>,
  { columns: ColumnWithId[] }
>
export interface TableFieldProps extends BaseFieldProps {
  schema: TableFieldSchema
}

const ShortTextColumnCell = ({
  schema,
  inputName,
}: {
  schema: ColumnWithId<ShortTextColumnBase>
  inputName: string
}) => {
  const rules = useMemo(() => createShortTextValidationRules(schema), [schema])

  return (
    <Controller
      name={inputName}
      rules={rules}
      render={({ field }) => <Input {...field} />}
    />
  )
}

/**
 * Renderer for each column cell in the table schema.
 */
const ColumnCell = ({
  schemaId,
  row,
  column,
  columnSchema,
}: UseTableCellProps<Record<string, unknown>, string> & {
  schemaId: string
  columnSchema: ColumnWithId
}) => {
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
    <FormControl
      isRequired={columnSchema.required}
      isInvalid={!!cellError}
      mb={6}
    >
      {renderedColumnCell}
      <FormErrorMessage>{cellError?.message}</FormErrorMessage>
    </FormControl>
  )
}

export const TableField = ({
  schema,
  questionNumber,
}: TableFieldProps): JSX.Element => {
  const columnsData = useMemo(() => {
    return schema.columns.map((c) => ({
      Header: c.title,
      accessor: c._id,
      Cell: ColumnCell,
    }))
  }, [schema.columns])

  const baseRowData = useMemo(
    () =>
      schema.columns.reduce((acc, c) => {
        acc[c._id] = ''
        return acc
      }, {} as Record<string, unknown>),
    [schema.columns],
  )

  const data = useMemo(() => {
    return times(schema.minimumRows, () => baseRowData)
  }, [baseRowData, schema.minimumRows])

  const formMethods = useForm({
    defaultValues: {
      [schema._id]: data,
    },
  })
  const { fields, append } = useFieldArray({
    control: formMethods.control,
    name: schema._id,
  })

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns: columnsData, data: fields })

  const handleAddRow = useCallback(() => {
    if (!schema.maximumRows || fields.length >= schema.maximumRows) return
    return append(baseRowData)
  }, [append, baseRowData, fields.length, schema.maximumRows])

  return (
    <FormProvider {...formMethods}>
      <form
        noValidate
        onSubmit={formMethods.handleSubmit((data) =>
          console.warn('submit', data),
        )}
      >
        <TableFieldContainer schema={schema} questionNumber={questionNumber}>
          <Table {...getTableProps()}>
            <Thead>
              {headerGroups.map((headerGroup) => (
                <Tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column) => (
                    <Th {...column.getHeaderProps()}>
                      {column.render('Header')}
                    </Th>
                  ))}
                </Tr>
              ))}
            </Thead>
            <Tbody {...getTableBodyProps()}>
              {rows.map((row) => {
                prepareRow(row)
                return (
                  <Tr {...row.getRowProps()}>
                    {row.cells.map((cell, j) => (
                      <Td {...cell.getCellProps()}>
                        {cell.render('Cell', {
                          schemaId: schema._id,
                          columnSchema: schema.columns[j],
                        })}
                      </Td>
                    ))}
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </TableFieldContainer>
        {schema.addMoreRows && (
          <AddRowFooter
            currentRows={fields.length}
            maxRows={schema.maximumRows}
            handleAddRow={handleAddRow}
          />
        )}
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  )
}

interface AddRowFooterProps {
  handleAddRow: () => void
  currentRows: number
  maxRows: number
}
const AddRowFooter = ({
  currentRows,
  maxRows,
  handleAddRow,
}: AddRowFooterProps) => {
  return (
    <Stack direction="row" justify="space-between" align="center">
      <Button
        isDisabled={currentRows >= maxRows}
        leftIcon={<BiPlus fontSize="1.5rem" />}
        type="button"
        onClick={handleAddRow}
      >
        Add another row
      </Button>

      <Text textStyle="body-2" color="secondary.400">
        {currentRows} out of max {maxRows} rows
      </Text>
    </Stack>
  )
}
