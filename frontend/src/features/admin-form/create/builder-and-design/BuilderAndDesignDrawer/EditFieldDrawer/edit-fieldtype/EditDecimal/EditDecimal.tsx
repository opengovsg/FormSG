import { useMemo } from 'react'
import { Controller, RegisterOptions } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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

import { CreatePageDrawerContentContainer } from '../../../../../common'
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
  (typeof EDIT_DECIMAL_FIELD_KEYS)[number]
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
  const { t } = useTranslation()
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
          t('features.adminForm.sidebar.fields.number.maxValueGreaterThanMin')
        )
      },
    }
  }, [getValues])

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
        <Toggle
          {...register('validateByValue', {
            deps: ['ValidationOptions'],
          })}
          label={t('features.adminForm.sidebar.fields.number.validation')}
        />
        {watchValidateByValue ? (
          <SimpleGrid
            mt="0.5rem"
            columns={{ base: 1, sm: 2, md: 1, lg: 2 }}
            spacing="0.5rem"
          >
            <Controller
              name="ValidationOptions.customMin"
              control={control}
              render={({ field: { value, ...field } }) => (
                <NumberInput
                  showSteppers={false}
                  placeholder={t(
                    'features.adminForm.sidebar.fields.number.minValue',
                  )}
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
                  placeholder={t(
                    'features.adminForm.sidebar.fields.number.maxValue',
                  )}
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
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </CreatePageDrawerContentContainer>
  )
}
