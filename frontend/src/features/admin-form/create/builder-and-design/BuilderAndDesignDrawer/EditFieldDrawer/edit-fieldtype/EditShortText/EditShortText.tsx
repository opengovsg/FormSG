import { useEffect, useMemo } from 'react'
import { Controller, RegisterOptions } from 'react-hook-form'
import {
  FormControl,
  InputGroup,
  InputRightElement,
  SimpleGrid,
} from '@chakra-ui/react'
import { extend, isEmpty, pick } from 'lodash'

import { ShortTextFieldBase, TextSelectedValidation } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import { SingleSelect } from '~components/Dropdown'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import NumberInput from '~components/NumberInput'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'
import { CopyButton } from '~templates/CopyButton'

import { DrawerContentContainer } from '../common/DrawerContentContainer'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

export type EditShortTextProps = EditFieldProps<ShortTextFieldBase>

const EDIT_SHORTTEXT_FIELD_KEYS = [
  'title',
  'description',
  'required',
  'allowPrefill',
] as const

type EditShortTextInputs = Pick<
  ShortTextFieldBase,
  typeof EDIT_SHORTTEXT_FIELD_KEYS[number]
> & {
  ValidationOptions: {
    selectedValidation: TextSelectedValidation | ''
    customVal: number | ''
  }
}

const transformShortTextFieldToEditForm = (
  field: ShortTextFieldBase,
): EditShortTextInputs => {
  const nextValidationOptions = {
    selectedValidation:
      field.ValidationOptions.selectedValidation || ('' as const),
    customVal:
      (!!field.ValidationOptions.selectedValidation &&
        field.ValidationOptions.customVal) ||
      ('' as const),
  }
  return {
    ...pick(field, EDIT_SHORTTEXT_FIELD_KEYS),
    ValidationOptions: nextValidationOptions,
  }
}

const transformShortTextEditFormToField = (
  inputs: EditShortTextInputs,
  originalField: ShortTextFieldBase,
): ShortTextFieldBase => {
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

export const EditShortText = ({ field }: EditShortTextProps): JSX.Element => {
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
  } = useEditFieldForm<EditShortTextInputs, ShortTextFieldBase>({
    field,
    transform: {
      input: transformShortTextFieldToEditForm,
      output: transformShortTextEditFormToField,
    },
  })

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  const watchedSelectedValidation = watch(
    'ValidationOptions.selectedValidation',
  )

  const watchAllowPrefill = watch('allowPrefill')

  const customValValidationOptions: RegisterOptions<
    EditShortTextInputs,
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

  // Effect to clear validation option errors when selection limit is toggled off.
  useEffect(() => {
    if (!watchedSelectedValidation) {
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
                items={Object.values(TextSelectedValidation)}
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
                isDisabled={!watchedSelectedValidation}
              />
            )}
          />
        </SimpleGrid>
        <FormErrorMessage>
          {errors?.ValidationOptions?.customVal?.message}
        </FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <Toggle
          {...register('allowPrefill')}
          label="Enable pre-fill"
          description="Use the Field ID to pre-populate this field for your users via an URL. [Learn how](https://go.gov.sg/form-prefill)"
        />
        {watchAllowPrefill ? (
          <InputGroup mt="0.5rem">
            <Input
              isReadOnly
              isDisabled={!field._id}
              value={
                field._id ??
                'Field ID will be generated after this field is saved'
              }
            />
            {field._id ? (
              <InputRightElement>
                <CopyButton
                  stringToCopy={field._id}
                  aria-label="Copy field ID value"
                />
              </InputRightElement>
            ) : null}
          </InputGroup>
        ) : null}
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
