import { useMemo } from 'react'
import { Controller, FormProvider, useFormState } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import { Column, ColumnDto, TableFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import NumberInput from '~components/NumberInput'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { DrawerContentContainer } from '../common/DrawerContentContainer'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

import { EditTableColumns } from './EditTableColumns'
import { isTemporaryColumnId } from './utils'

const EDIT_TABLE_FIELD_KEYS = [
  'title',
  'description',
  'required',
  'addMoreRows',
  'maximumRows',
  'columns',
] as const

export type EditTableInputs = Omit<
  Pick<TableFieldBase, typeof EDIT_TABLE_FIELD_KEYS[number]>,
  'columns'
> & {
  // Every column must have an ID for react-table to render.
  columns: ColumnDto[]
}

type EditTableProps = EditFieldProps<TableFieldBase>

export const EditTable = ({ field }: EditTableProps): JSX.Element => {
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
      input: (inputField) => pick(inputField, EDIT_TABLE_FIELD_KEYS),
      output: (formOutput, originalField) =>
        extend({}, originalField, formOutput),
      preSubmit: ({ columns, ...rest }, output) => {
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
      <FormProvider {...formMethods}>
        <EditTableColumns isLoading={isLoading} />
      </FormProvider>
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
