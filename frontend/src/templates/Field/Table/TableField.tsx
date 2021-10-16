/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import {
  Controller,
  FieldError,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { useTable, UseTableCellProps } from 'react-table'
import { FormControl, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import { get } from 'lodash'
import { Merge } from 'type-fest'

import { Column, FormFieldWithId, TableFieldBase } from '~shared/types/field'

import { FormErrorMessage } from '~components/FormControl/FormErrorMessage/FormErrorMessage'
import Input from '~components/Input'

import { BaseFieldProps } from '../FieldContainer'

import { TableFieldContainer } from './TableFieldContainer'

type ColumnWithId = Column & { _id: string }
export type TableFieldSchema = Merge<
  FormFieldWithId<TableFieldBase>,
  { columns: ColumnWithId[] }
>
export interface TableFieldProps extends BaseFieldProps {
  schema: TableFieldSchema
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

  return (
    <FormControl
      isRequired={columnSchema.required}
      isInvalid={!!cellError}
      mb={6}
    >
      <Controller
        name={inputName}
        rules={{ required: { value: true, message: 'field is required' } }}
        render={({ field }) => <Input {...field} />}
      />
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

  const data = useMemo(() => {
    return [
      schema.columns.reduce((acc, c) => {
        acc[c._id] = ''
        return acc
      }, {} as Record<string, unknown>),
    ]
  }, [schema.columns])

  const formMethods = useForm({
    defaultValues: {
      [schema._id]: data,
    },
  })
  const { fields } = useFieldArray({
    control: formMethods.control,
    name: schema._id,
  })

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns: columnsData, data: fields })

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
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  )
}
