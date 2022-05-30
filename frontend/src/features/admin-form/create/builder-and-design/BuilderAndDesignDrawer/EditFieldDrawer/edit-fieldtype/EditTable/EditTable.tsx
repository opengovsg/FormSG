import { useMemo } from 'react'
import { Controller, useFieldArray } from 'react-hook-form'
import { FormControl, Stack, StackDivider } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import {
  BasicField,
  DropdownColumnBase,
  TableFieldBase,
} from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown'
import { ComboboxItem } from '~components/Dropdown/types'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import NumberInput from '~components/NumberInput'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { BASICFIELD_TO_DRAWER_META } from '../../../../../constants'
import { DrawerContentContainer } from '../common/DrawerContentContainer'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

import { EditTableDropdown } from './EditTableDropdown'

const EDIT_TABLE_FIELD_KEYS = [
  'title',
  'description',
  'required',
  'addMoreRows',
  'maximumRows',
  'columns',
] as const

export type EditTableInputs = Pick<
  TableFieldBase,
  typeof EDIT_TABLE_FIELD_KEYS[number]
>

export type EditTableDropdownInputs = Omit<
  DropdownColumnBase,
  'ValidationOptions'
> & {
  // Differs from fieldOptions in DropdownFieldBase because input is a string. Will be converted to array using SPLIT_TEXTAREA_TRANSFORM
  fieldOptionsString: string
}

type EditTableProps = EditFieldProps<TableFieldBase>

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

export const EditTable = ({ field }: EditTableProps): JSX.Element => {
  const {
    register,
    getValues,
    formState: { errors },
    control,
    watch,
    isSaveEnabled,
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditTableInputs, TableFieldBase>({
    field,
    transform: {
      input: (inputField) => pick(inputField, EDIT_TABLE_FIELD_KEYS),
      output: (formOutput, originalField) =>
        extend({}, originalField, formOutput),
    },
  })

  const watchedAddMoreRows = watch('addMoreRows')

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'columns',
  })

  console.log(fields)

  return (
    <DrawerContentContainer>
      <FormControl isRequired isReadOnly={isLoading} isInvalid={!!errors.title}>
        <FormLabel>Question</FormLabel>
        <Input autoFocus {...register('title', requiredValidationRule)} />
        <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading} isInvalid={!!errors.description}>
        <FormLabel>Description</FormLabel>
        <Textarea {...register('description')} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
      </FormControl>
      <Stack divider={<StackDivider />} spacing="3rem">
        {fields.map((column, index) => (
          <Stack key={column.id} spacing="1rem">
            <FormControl isRequired isReadOnly={isLoading}>
              <FormLabel>{`Column ${index + 1}`}</FormLabel>
              <Input
                {...register(`columns.${index}.title`, requiredValidationRule)}
              />
            </FormControl>
            <FormControl
              isRequired
              isReadOnly={isLoading}
              isInvalid={!!errors.maximumRows}
            >
              <Controller
                name={`columns.${index}.columnType`}
                control={control}
                render={({ field }) => (
                  <SingleSelect
                    items={TABLE_COLUMN_DROPDOWN_OPTIONS}
                    {...field}
                  />
                )}
              />
              {getValues(`columns.${index}.columnType`) ===
                BasicField.Dropdown && (
                <EditTableDropdown
                  control={control}
                  index={index}
                  errors={errors}
                />
              )}
            </FormControl>
            <FormControl isReadOnly={isLoading}>
              <Toggle
                {...register(`columns.${index}.required`)}
                label="Required"
              />
            </FormControl>
          </Stack>
        ))}
      </Stack>
      <FormControl isReadOnly={isLoading}>
        <Toggle
          {...register('addMoreRows')}
          label="Allow respondent to add more rows"
        />
      </FormControl>
      {watchedAddMoreRows ? (
        <FormControl
          isRequired
          isReadOnly={isLoading}
          isInvalid={!!errors.maximumRows}
        >
          <FormLabel>Maximum rows allowed</FormLabel>
          <Controller
            name="maximumRows"
            control={control}
            render={({ field }) => (
              <NumberInput
                flex={1}
                {...field}
                placeholder="Number of characters"
              />
            )}
          />
          <FormErrorMessage>{errors?.maximumRows?.message}</FormErrorMessage>
        </FormControl>
      ) : null}
      <FormFieldDrawerActions
        isLoading={isLoading}
        isSaveEnabled={isSaveEnabled}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </DrawerContentContainer>
  )
}
