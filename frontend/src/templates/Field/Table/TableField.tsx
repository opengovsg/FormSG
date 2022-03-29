import { useCallback, useMemo } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { BiTrash } from 'react-icons/bi'
import { useTable } from 'react-table'
import { Box, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react'

import { FormFieldWithId, TableFieldBase } from '~shared/types/field'

import IconButton from '~components/IconButton'

import { BaseFieldProps } from '../FieldContainer'

import { AddRowFooter } from './AddRowFooter'
import { ColumnCell } from './ColumnCell'
import { ColumnHeader } from './ColumnHeader'
import { TableFieldContainer } from './TableFieldContainer'

export type TableFieldSchema = FormFieldWithId<TableFieldBase>
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
      Header: (
        <ColumnHeader title={c.title} isRequired={c.required} id={c._id} />
      ),
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

  const { fields, append, remove } = useFieldArray({
    control: formMethods.control,
    name: schema._id,
  })

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns: columnsData, data: fields })

  const handleAddRow = useCallback(() => {
    if (!schema.maximumRows || fields.length >= schema.maximumRows) return
    return append(baseRowData)
  }, [append, baseRowData, fields.length, schema.maximumRows])

  const handleRemoveRow = useCallback(
    (rowIndex: number) => {
      if (fields.length <= schema.minimumRows || rowIndex >= fields.length) {
        return
      }
      return remove(rowIndex)
    },
    [fields.length, remove, schema.minimumRows],
  )

  return (
    <TableFieldContainer schema={schema} questionNumber={questionNumber}>
      <Box d="block" w="100%" overflowX="auto">
        <Table
          {...getTableProps()}
          variant="column-stripe"
          size="sm"
          colorScheme="primary"
        >
          <Thead display={{ base: 'none', md: 'table-header-group' }}>
            {headerGroups.map((headerGroup) => (
              <Tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column, _idx, array) => (
                  <Th
                    {...column.getHeaderProps()}
                    w={{ base: 'initial', md: `calc(100%/${array.length})` }}
                    minW="15rem"
                    display={{ base: 'block', md: 'table-cell' }}
                  >
                    {column.render('Header')}
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody {...getTableBodyProps()} verticalAlign="baseline">
            {rows.map((row, rowIndex) => {
              prepareRow(row)
              return (
                // The `key` prop is required for useFieldArray to remove the correct row.
                <Tr {...row.getRowProps()} key={row.original.id}>
                  {row.cells.map((cell, j) => (
                    <Td
                      {...cell.getCellProps()}
                      display={{ base: 'block', md: 'table-cell' }}
                    >
                      {cell.render('Cell', {
                        schemaId: schema._id,
                        columnSchema: schema.columns[j],
                      })}
                    </Td>
                  ))}

                  {schema.addMoreRows ? (
                    <Td
                      verticalAlign="top"
                      textAlign="end"
                      display={{ base: 'block', md: 'table-cell' }}
                    >
                      <IconButton
                        isDisabled={fields.length <= schema.minimumRows}
                        variant="clear"
                        colorScheme="danger"
                        aria-label="Remove row"
                        icon={<BiTrash />}
                        onClick={() => handleRemoveRow(rowIndex)}
                      />
                    </Td>
                  ) : null}
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      </Box>
      {schema.addMoreRows && schema.maximumRows !== undefined ? (
        <AddRowFooter
          currentRows={fields.length}
          maxRows={schema.maximumRows}
          handleAddRow={handleAddRow}
        />
      ) : null}
    </TableFieldContainer>
  )
}
