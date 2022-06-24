import { useCallback, useMemo } from 'react'
import {
  Controller,
  DeepPartial,
  FormProvider,
  UnpackNestedValue,
  useFormState,
} from 'react-hook-form'
import { FormControl, Stack, StackDivider } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import { Column, ColumnDto, TableFieldBase } from '~shared/types/field'

import { REQUIRED_ERROR } from '~constants/validation'
import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import NumberInput from '~components/NumberInput'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { isTemporaryColumnId } from '~features/admin-form/create/builder-and-design/utils/columnCreation'
import { validateNumberInput } from '~features/admin-form/create/builder-and-design/utils/validateNumberInput'

import { DrawerContentContainer } from '../common/DrawerContentContainer'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

import { EditTableColumns } from './EditTableColumns'

const EDIT_TABLE_FIELD_KEYS = [
  'title',
  'description',
  'required',
  'addMoreRows',
  'minimumRows',
  'maximumRows',
  'columns',
] as const

export type EditTableInputs = Omit<
  Pick<TableFieldBase, typeof EDIT_TABLE_FIELD_KEYS[number]>,
  'columns' | 'maximumRows' | 'minimumRows'
> & {
  // Every column must have an ID for react-table to render.
  columns: ColumnDto[]
  maximumRows: number | ''
  minimumRows: number | ''
}

export type EditTableProps = EditFieldProps<TableFieldBase>

const transformTableFieldToEditForm = (
  field: TableFieldBase,
): UnpackNestedValue<DeepPartial<EditTableInputs>> => {
  const nextMaxRows = field.maximumRows || ''
  const nextMinRows = field.minimumRows || ''

  return {
    ...pick(field, EDIT_TABLE_FIELD_KEYS),
    maximumRows: nextMaxRows,
    minimumRows: nextMinRows,
  }
}

const transformTableEditFormToField = (
  inputs: EditTableInputs,
  originalField: TableFieldBase,
): TableFieldBase => {
  return extend({}, originalField, inputs)
}

export const EditTable = ({ field }: EditTableProps): JSX.Element => {
  const preSubmitTransform = useCallback(
    ({ columns, ...rest }: EditTableInputs, output: TableFieldBase) => {
      // Columns may have temporary ids due to admins adding new columns when editing the field.
      // react-table requires an id to render the admin builder preview.
      // We need to remove any temporary ids before submitting the updated field
      // (without touching non-temp ids) so the server can assign an id as per usual.
      const columnsWithoutTempIds: Column[] = columns.map((column) => {
        const { _id, ...restColumn } = column
        if (isTemporaryColumnId(_id)) {
          return restColumn
        }
        return column
      })
      return extend({}, output, {
        ...rest,
        columns: columnsWithoutTempIds,
      })
    },
    [],
  )

  const {
    formMethods,
    isSaveEnabled,
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditTableInputs, TableFieldBase>({
    field,
    transform: {
      input: transformTableFieldToEditForm,
      output: transformTableEditFormToField,
      preSubmit: preSubmitTransform,
    },
  })

  const { register, getValues, control } = formMethods
  const { errors } = useFormState({ control })

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

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
      <Stack spacing="2rem">
        <FormControl
          isRequired
          isReadOnly={isLoading}
          isInvalid={!!errors.minimumRows}
        >
          <FormLabel>Minimum rows</FormLabel>
          <Controller
            name="minimumRows"
            control={control}
            rules={{
              required: REQUIRED_ERROR,
              min: {
                value: 1,
                message: 'Minimum rows must be greater than 0',
              },
              deps: ['maximumRows'],
            }}
            render={({ field: { onChange, ...rest } }) => (
              <NumberInput
                flex={1}
                onChange={(valStr, valNum) => {
                  validateNumberInput(onChange, valStr, valNum)
                }}
                {...rest}
              />
            )}
          />
          <FormErrorMessage>{errors?.minimumRows?.message}</FormErrorMessage>
        </FormControl>
        <FormControl isReadOnly={isLoading}>
          <Toggle
            {...register('addMoreRows')}
            label="Allow respondent to add more rows"
          />
        </FormControl>
        {getValues('addMoreRows') ? (
          <FormControl
            isRequired
            isReadOnly={isLoading}
            isInvalid={!!errors.maximumRows}
          >
            <FormLabel>Maximum rows allowed</FormLabel>
            <Controller
              name="maximumRows"
              defaultValue=""
              rules={{
                required: REQUIRED_ERROR,
                min: {
                  value: 1,
                  message: 'Maximum rows must be greater than 0',
                },
                // Must be greater than minimum rows
                validate: (value) =>
                  !value ||
                  value > getValues('minimumRows') ||
                  'Maximum rows must be greater than minimum rows',
              }}
              control={control}
              render={({ field: { onChange, ...rest } }) => (
                <NumberInput
                  flex={1}
                  onChange={(valStr, valNum) => {
                    validateNumberInput(onChange, valStr, valNum)
                  }}
                  {...rest}
                />
              )}
            />
            <FormErrorMessage>{errors?.maximumRows?.message}</FormErrorMessage>
          </FormControl>
        ) : null}
      </Stack>
      <FormProvider {...formMethods}>
        <EditTableColumns isLoading={isLoading} />
      </FormProvider>
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
