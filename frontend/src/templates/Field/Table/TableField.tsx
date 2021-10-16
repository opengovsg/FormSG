/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { memo, useMemo } from 'react'
import {
  Box,
  chakra,
  Table,
  TableCaption,
  Tbody,
  Text,
  Tfoot,
  Th,
  Thead,
  Tr,
  useMultiStyleConfig,
  useStyleConfig,
} from '@chakra-ui/react'
import { times } from 'lodash'
import { Merge } from 'type-fest'

import { Column, FormFieldWithId, TableFieldBase } from '~shared/types/field'

import { TABLE_THEME_KEY } from '~theme/components/Field/Table'
import FormLabel from '~components/FormControl/FormLabel'

import { BaseFieldProps } from '../FieldContainer'

import { TableFieldContainer } from './TableFieldContainer'
import { TableRow } from './TableRow'

export type TableFieldSchema = Merge<
  FormFieldWithId<TableFieldBase>,
  { columns: (Column & { _id: string })[] }
>
export interface TableFieldProps extends BaseFieldProps {
  schema: TableFieldSchema
}

export const TableField = ({
  schema,
  questionNumber,
}: TableFieldProps): JSX.Element => {
  const memoizedRows = useMemo(
    () => (
      <>
        {times(schema.minimumRows, (rowNumber) => {
          return (
            <TableRow
              row={rowNumber}
              name={schema._id}
              columns={schema.columns}
            />
          )
        })}
      </>
    ),
    [schema._id, schema.columns, schema.minimumRows],
  )

  const styles = useMultiStyleConfig(TABLE_THEME_KEY, {})

  return (
    <TableFieldContainer schema={schema} questionNumber={questionNumber}>
      <Table variant="simple">
        <Thead>
          <Tr>
            {schema.columns.map((c) => {
              console.log('ISREUIQRED', c.required)

              return (
                <Th key={c._id} textTransform="initial">
                  <FormLabel
                    isRequired={c.required}
                    id={c._id}
                    sx={styles.label}
                  >
                    {c.title}
                  </FormLabel>
                </Th>
              )
            })}
          </Tr>
        </Thead>
        <Tbody>{memoizedRows}</Tbody>
      </Table>
    </TableFieldContainer>
  )
}
