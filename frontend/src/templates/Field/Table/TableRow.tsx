import { useMemo } from 'react'
import { get, useFormContext } from 'react-hook-form'
import { FormControl, Td, Tr } from '@chakra-ui/react'

import { createTableColumnValidationRules } from '~utils/fieldValidation'
import Input from '~components/Input'

import { TableFieldSchema } from './TableField'

export interface TableRowProps {
  name: string
  row: number
  columns: TableFieldSchema['columns']
}

export const TableRow = ({
  name,
  row,
  columns,
}: TableRowProps): JSX.Element => {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const columnValidationRules = useMemo(() => {
    return columns.map((c) => createTableColumnValidationRules(c))
  }, [columns])

  return (
    <Tr>
      {columns.map((c, idx) => {
        const fieldName = `${name}.${c._id}`
        const isInvalid = get(errors, fieldName)
        return (
          <Td key={c._id}>
            <FormControl isInvalid={isInvalid}>
              <Input
                aria-labelledby={c._id}
                {...register(`${fieldName}.${row}`, columnValidationRules[idx])}
              />
            </FormControl>
          </Td>
        )
      })}
    </Tr>
  )
}
