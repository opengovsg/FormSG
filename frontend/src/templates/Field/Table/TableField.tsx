import { useCallback, useMemo } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { useTable } from 'react-table'
import { Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'
import { Merge, RequireAllOrNone } from 'type-fest'

import { Column, FormFieldWithId, TableFieldBase } from '~shared/types/field'

import { FormErrorMessage } from '~components/FormControl/FormErrorMessage/FormErrorMessage'

import { BaseFieldProps } from '../FieldContainer'

import { AddRowFooter } from './AddRowFooter'
import { ColumnCell } from './ColumnCell'
import { ColumnHeader } from './ColumnHeader'
import { TableFieldContainer } from './TableFieldContainer'

export type ColumnWithId<T = Column> = T & { _id: string }
export type TableFieldSchema = Merge<
  RequireAllOrNone<
    FormFieldWithId<TableFieldBase>,
    'addMoreRows' | 'maximumRows'
  >,
  { columns: ColumnWithId[] }
>
export interface TableFieldProps extends BaseFieldProps {
  schema: TableFieldSchema
}

/**
 * Field renderer for Table fields.
 * @precondition This component uses `react-hook-form#useFieldArray`, and will require defaultValues to be populated in the parent `useForm` hook.
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const TableField = ({
  schema,
  questionNumber,
}: TableFieldProps): JSX.Element => {
  const columnsData = useMemo(() => {
    return schema.columns.map((c) => ({
      Header: <ColumnHeader title={c.title} isRequired={c.required} />,
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

  const formMethods =
    useFormContext<Record<string, Record<string, unknown>[]>>()

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
    <TableFieldContainer schema={schema} questionNumber={questionNumber}>
      <Table {...getTableProps()} d="inline-block" overflowX="auto">
        <Thead>
          {headerGroups.map((headerGroup) => (
            <Tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column, _idx, array) => (
                <Th
                  {...column.getHeaderProps()}
                  w={`calc(100%/${array.length})`}
                  minW="15rem"
                  id={column.id}
                >
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
      {/* Assume any error is required error, since that's the only error (for now) */}
      <FormErrorMessage my="0.75rem">
        Please fill in the required fields
      </FormErrorMessage>
      {schema.addMoreRows && (
        <AddRowFooter
          currentRows={fields.length}
          maxRows={schema.maximumRows}
          handleAddRow={handleAddRow}
        />
      )}
    </TableFieldContainer>
  )
}
