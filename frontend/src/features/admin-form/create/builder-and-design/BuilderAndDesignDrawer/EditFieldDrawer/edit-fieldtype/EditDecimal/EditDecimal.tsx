import { useMemo } from 'react'
import { Controller, RegisterOptions } from 'react-hook-form'
import { FormControl, SimpleGrid } from '@chakra-ui/react'
import { extend, isEmpty, pick } from 'lodash'

import { DecimalFieldBase } from '~shared/types/field'

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

type EditDecimalProps = EditFieldProps<DecimalFieldBase>

const EDIT_DECIMAL_FIELD_KEYS = [
  'title',
  'description',
  'required',
  'ValidationOptions',
  'validateByValue',
] as const

type EditDecimalInputs = Pick<
  DecimalFieldBase,
  typeof EDIT_DECIMAL_FIELD_KEYS[number]
>

const transformDecimalEditFormToField = (
  inputs: EditDecimalInputs,
  originalField: DecimalFieldBase,
): DecimalFieldBase => {
  let nextValidationOptions = inputs.ValidationOptions
  // Clear values if toggled off.
  if (!inputs.validateByValue) {
    nextValidationOptions = {
      customMax: null,
      customMin: null,
    }
  }
  return extend({}, originalField, inputs, {
    ValidationOptions: nextValidationOptions,
  })
}

export const EditDecimal = ({ field }: EditDecimalProps): JSX.Element => {
  const {
    register,
    formState: { errors },
    getValues,
    isSaveEnabled,
    buttonText,
    handleUpdateField,
    watch,
    control,
    clearErrors,
    isLoading,
    handleCancel,
    setValue,
  } = useEditFieldForm<EditDecimalInputs, DecimalFieldBase>({
    field,
    transform: {
      input: (inputField) => pick(inputField, EDIT_DECIMAL_FIELD_KEYS),
      output: transformDecimalEditFormToField,
    },
  })

  const watchValidateByValue = watch('validateByValue')

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  const customMaxValidationRule: RegisterOptions<
    EditDecimalInputs,
    'ValidationOptions.customMax'
  > = useMemo(() => {
    return {
      deps: ['ValidationOptions.customMin'],
      validate: (val) => {
        return (
          !val ||
          !getValues('validateByValue') ||
          Number(val) >= Number(getValues('ValidationOptions.customMin')) ||
          'Maximum value cannot be smaller than the minimum value.'
        )
      },
    }
  }, [getValues])

  return (
    <DrawerContentContainer>
      <FormControl isRequired isReadOnly={isLoading} isInvalid={!!errors.title}>
        <FormLabel>Question</FormLabel>
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
        <Toggle
          {...register('validateByValue', {
            deps: ['ValidationOptions'],
          })}
          label="Number validation"
        />
        {watchValidateByValue ? (
          <SimpleGrid mt="0.5rem" columns={2} spacing="0.5rem">
            <Controller
              name="ValidationOptions.customMin"
              control={control}
              render={({ field: { value, ...field } }) => (
                <NumberInput
                  showSteppers={false}
                  placeholder="Minimum value"
                  value={value ?? ''}
                  {...field}
                />
              )}
            />
            <Controller
              name="ValidationOptions.customMax"
              control={control}
              rules={customMaxValidationRule}
              render={({ field: { value, ...field } }) => (
                <NumberInput
                  showSteppers={false}
                  value={value ?? ''}
                  {...field}
                  placeholder="Maximum value"
                />
              )}
            />
          </SimpleGrid>
        ) : null}
        <FormErrorMessage>
          {errors?.ValidationOptions?.customMax?.message}
        </FormErrorMessage>
      </FormControl>
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
