import { useEffect, useMemo } from 'react'
import { Controller, RegisterOptions } from 'react-hook-form'
import { FormControl, SimpleGrid } from '@chakra-ui/react'
import { extend, isEmpty, pick } from 'lodash'

import { NumberFieldBase, NumberSelectedValidation } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import NumberInput from '~components/NumberInput'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { DrawerContentContainer } from './common/DrawerContentContainer'
import { FormFieldDrawerActions } from './common/FormFieldDrawerActions'
import { EditFieldProps } from './common/types'
import { useEditFieldForm } from './common/useEditFieldForm'

type EditNumberProps = EditFieldProps<NumberFieldBase>

const EDIT_NUMBER_FIELD_KEYS = ['title', 'description', 'required'] as const

type EditNumberInputs = Pick<
  NumberFieldBase,
  typeof EDIT_NUMBER_FIELD_KEYS[number]
> & {
  ValidationOptions: {
    selectedValidation: NumberSelectedValidation | ''
    customVal: number | ''
  }
}

const transformNumberFieldToEditForm = (
  field: NumberFieldBase,
): EditNumberInputs => {
  const nextValidationOptions =
    field.ValidationOptions.selectedValidation === null
      ? {
          selectedValidation: '' as const,
          customVal: '' as const,
        }
      : {
          selectedValidation: field.ValidationOptions.selectedValidation,
          customVal:
            field.ValidationOptions.customVal === null
              ? ('' as const)
              : field.ValidationOptions.customVal,
        }
  return {
    ...pick(field, EDIT_NUMBER_FIELD_KEYS),
    ValidationOptions: nextValidationOptions,
  }
}

const transformNumberEditFormToField = (
  form: EditNumberInputs,
  originalField: NumberFieldBase,
): NumberFieldBase => {
  const nextValidationOptions =
    form.ValidationOptions.selectedValidation === ''
      ? {
          selectedValidation: null,
          customVal: null,
        }
      : form.ValidationOptions
  return extend({}, originalField, form, {
    ValidationOptions: nextValidationOptions,
  })
}

export const EditNumber = ({ field }: EditNumberProps): JSX.Element => {
  const {
    register,
    formState: { errors },
    isSaveEnabled,
    buttonText,
    handleUpdateField,
    watch,
    control,
    clearErrors,
    isLoading,
    handleCancel,
    setValue,
  } = useEditFieldForm<EditNumberInputs, NumberFieldBase>({
    field,
    transform: {
      input: transformNumberFieldToEditForm,
      output: transformNumberEditFormToField,
    },
  })

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  const watchedSelectedValidation = watch(
    'ValidationOptions.selectedValidation',
  )

  const customValValidationOptions: RegisterOptions = useMemo(
    () => ({
      required: {
        value: watchedSelectedValidation !== '',
        message: 'Please enter number of characters',
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
    [watchedSelectedValidation],
  )

  // Effect to clear validation option errors when selection limit is toggled off.
  useEffect(() => {
    if (watchedSelectedValidation === '') {
      clearErrors('ValidationOptions')
      setValue('ValidationOptions.customVal', '')
    }
  }, [clearErrors, setValue, watchedSelectedValidation])

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
        <FormLabel isRequired>Number of characters allowed</FormLabel>
        <SimpleGrid mt="0.5rem" columns={2} spacing="0.5rem">
          <Controller
            name="ValidationOptions.selectedValidation"
            control={control}
            render={({ field }) => (
              <SingleSelect
                items={Object.values(NumberSelectedValidation)}
                {...field}
              />
            )}
          />
          <Controller
            name="ValidationOptions.customVal"
            control={control}
            rules={customValValidationOptions}
            render={({ field }) => (
              <NumberInput
                flex={1}
                showSteppers={false}
                {...field}
                placeholder="Number of characters"
                isDisabled={watchedSelectedValidation === ''}
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
        isSaveEnabled={isSaveEnabled}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </DrawerContentContainer>
  )
}
