import { useMemo } from 'react'
import {
  Controller,
  useFieldArray,
  useFormContext,
  useFormState,
} from 'react-hook-form'
import { FormControl, Stack, StackDivider } from '@chakra-ui/react'
import { pick } from 'lodash'

import { BasicField, TableFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown'
import { ComboboxItem } from '~components/Dropdown/types'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Toggle from '~components/Toggle'

import { BASICFIELD_TO_DRAWER_META } from '../../../../../constants'

import { EditTableInputs } from './EditTable'
import { EditTableDropdown } from './EditTableDropdown'

const TABLE_COLUMN_DROPDOWN_OPTIONS: ComboboxItem<
  TableFieldBase['columns'][number]['columnType']
>[] = [
  {
    ...pick(BASICFIELD_TO_DRAWER_META[BasicField.ShortText], 'icon', 'label'),
    value: BasicField.ShortText,
  },
  {
    ...pick(BASICFIELD_TO_DRAWER_META[BasicField.Dropdown], 'icon', 'label'),
    value: BasicField.Dropdown,
  },
]

interface EditTableColumnsProps {
  isLoading: boolean
}

export const EditTableColumns = ({
  isLoading,
}: EditTableColumnsProps): JSX.Element => {
  const { register, control, getValues } = useFormContext<EditTableInputs>()
  const { errors } = useFormState<EditTableInputs>()
  const { fields, append, remove } = useFieldArray({
    name: 'columns',
  })

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  return (
    <Stack
      divider={<StackDivider borderColor="secondary.100" />}
      spacing="2rem"
    >
      {fields.map((column, index) => (
        <Stack key={column.id} spacing="1rem">
          <FormControl
            isRequired
            isReadOnly={isLoading}
            isInvalid={!!errors?.columns?.[index]?.title}
          >
            <FormLabel>{`Column ${index + 1}`}</FormLabel>
            <Input
              {...register(`columns.${index}.title`, requiredValidationRule)}
            />
            <FormErrorMessage>
              {errors?.columns?.[index]?.title?.message}
            </FormErrorMessage>
          </FormControl>
          <FormControl
            isRequired
            isReadOnly={isLoading}
            isInvalid={!!errors.columns?.[index]?.columnType}
          >
            <Controller
              name={`columns.${index}.columnType`}
              control={control}
              rules={requiredValidationRule}
              render={({ field }) => (
                <SingleSelect
                  items={TABLE_COLUMN_DROPDOWN_OPTIONS}
                  {...field}
                />
              )}
            />
            <FormErrorMessage>
              {errors?.columns?.[index]?.columnType?.message}
            </FormErrorMessage>
          </FormControl>
          {getValues(`columns.${index}.columnType`) === BasicField.Dropdown && (
            <EditTableDropdown inputName={`columns.${index}.fieldOptions`} />
          )}
          <FormControl isReadOnly={isLoading}>
            <Toggle
              {...register(`columns.${index}.required`)}
              label="Required"
            />
          </FormControl>
        </Stack>
      ))}
    </Stack>
  )
}
