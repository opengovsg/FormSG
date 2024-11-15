import { useMemo } from 'react'
import { Controller, RegisterOptions } from 'react-hook-form'
import { FormControl, SimpleGrid } from '@chakra-ui/react'
import { extend, isEmpty, pick } from 'lodash'

import { LongTextFieldBase, TextSelectedValidation } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import NumberInput from '~components/NumberInput'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { validateNumberInput } from '~features/admin-form/create/builder-and-design/utils/validateNumberInput'

import { CreatePageDrawerContentContainer } from '../../../../../common'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

export type EditLongTextProps = EditFieldProps<LongTextFieldBase>

const EDIT_LONGTEXT_FIELD_KEYS = ['title', 'description', 'required'] as const

type EditLongTextInputs = Pick<
  LongTextFieldBase,
  (typeof EDIT_LONGTEXT_FIELD_KEYS)[number]
> & {
  ValidationOptions: {
    selectedValidation: TextSelectedValidation | ''
    customVal: number | ''
  }
}

const transformLongTextFieldToEditForm = (
  field: LongTextFieldBase,
): EditLongTextInputs => {
  const nextValidationOptions = {
    selectedValidation:
      field.ValidationOptions.selectedValidation || ('' as const),
    customVal:
      (!!field.ValidationOptions.selectedValidation &&
        field.ValidationOptions.customVal) ||
      ('' as const),
  }
  return {
    ...pick(field, EDIT_LONGTEXT_FIELD_KEYS),
    ValidationOptions: nextValidationOptions,
  }
}

const transformLongTextEditFormToField = (
  inputs: EditLongTextInputs,
  originalField: LongTextFieldBase,
): LongTextFieldBase => {
  const nextValidationOptions =
    inputs.ValidationOptions.selectedValidation === ''
      ? {
          selectedValidation: null,
          customVal: null,
        }
      : inputs.ValidationOptions
  return extend({}, originalField, inputs, {
    ValidationOptions: nextValidationOptions,
  })
}

export const EditLongText = ({ field }: EditLongTextProps): JSX.Element => {
  const {
    register,
    formState: { errors },
    getValues,
    buttonText,
    handleUpdateField,
    watch,
    control,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditLongTextInputs, LongTextFieldBase>({
    field,
    transform: {
      input: transformLongTextFieldToEditForm,
      output: transformLongTextEditFormToField,
    },
  })

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  const watchedSelectedValidation = watch(
    'ValidationOptions.selectedValidation',
  )

  const customValValidationOptions: RegisterOptions<
    EditLongTextInputs,
    'ValidationOptions.customVal'
  > = useMemo(
    () => ({
      // customVal is required if there is selected validation.
      validate: {
        hasValidation: (val) => {
          return (
            !!val ||
            !getValues('ValidationOptions.selectedValidation') ||
            'Please enter number of characters'
          )
        },
        validNumber: (val) => {
          // Check whether input is a valid number, avoid e
          return !isNaN(Number(val)) || 'Please enter a valid number'
        },
      },
      min: {
        value: 1,
        message: 'Cannot be less than 1',
      },
      max: {
        value: 10000,
        message: 'Cannot be more than 10000',
      },
    }),
    [getValues],
  )

  return (
    <CreatePageDrawerContentContainer>
      <FormControl isRequired isReadOnly={isLoading} isInvalid={!!errors.title}>
        <FormLabel>Field Name</FormLabel>
        <Input autoFocus {...register('title', requiredValidationRule)} />
        <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl
        isRequired
        isReadOnly={isLoading}
        isInvalid={!!errors.description}
      >
        <FormLabel>Description</FormLabel>
        <Textarea {...register('description')} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <Toggle {...register('required')} label="Required" />
      </FormControl>
      <FormControl
        isReadOnly={isLoading}
        isInvalid={!isEmpty(errors.ValidationOptions)}
      >
        <FormLabel isRequired>Number of characters allowed</FormLabel>
        <SimpleGrid
          mt="0.5rem"
          columns={{ base: 2, md: 1, lg: 2 }}
          spacing="0.5rem"
        >
          <Controller
            name="ValidationOptions.selectedValidation"
            control={control}
            rules={{
              deps: ['ValidationOptions.customVal'],
            }}
            render={({ field }) => (
              <SingleSelect
                items={Object.values(TextSelectedValidation)}
                {...field}
              />
            )}
          />
          <Controller
            name="ValidationOptions.customVal"
            control={control}
            rules={customValValidationOptions}
            render={({ field: { onChange, ...rest } }) => (
              <NumberInput
                flex={1}
                inputMode="numeric"
                showSteppers={false}
                placeholder="Number of characters"
                isDisabled={!watchedSelectedValidation}
                onChange={validateNumberInput(onChange)}
                {...rest}
              />
            )}
          />
        </SimpleGrid>
        <FormErrorMessage>
          {errors?.ValidationOptions?.customVal?.message}
        </FormErrorMessage>
      </FormControl>
      <FormFieldDrawerActions
        isLoading={isLoading}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </CreatePageDrawerContentContainer>
  )
}
