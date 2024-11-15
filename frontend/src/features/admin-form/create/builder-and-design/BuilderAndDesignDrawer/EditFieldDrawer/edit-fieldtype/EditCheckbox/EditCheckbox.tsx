import { useCallback, useEffect, useMemo } from 'react'
import { Controller, RegisterOptions } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Box, FormControl, SimpleGrid } from '@chakra-ui/react'
import { extend, isEmpty, pick } from 'lodash'

import { CheckboxFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import NumberInput from '~components/NumberInput'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { validateNumberInput } from '~features/admin-form/create/builder-and-design/utils/validateNumberInput'

import { CreatePageDrawerContentContainer } from '../../../../../common'
import {
  DUPLICATE_OTHERS_VALIDATION,
  SPLIT_TEXTAREA_TRANSFORM,
  SPLIT_TEXTAREA_VALIDATION,
} from '../common/constants'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

type EditCheckboxProps = EditFieldProps<CheckboxFieldBase>

const EDIT_CHECKBOX_FIELD_KEYS = [
  'title',
  'description',
  'required',
  'othersRadioButton',
  'validateByValue',
] as const

type EditCheckboxKeys = (typeof EDIT_CHECKBOX_FIELD_KEYS)[number]

type EditCheckboxInputs = Pick<CheckboxFieldBase, EditCheckboxKeys> & {
  fieldOptions: string
  ValidationOptions: {
    customMin: string
    customMax: string
  }
}

const transformCheckboxFieldToEditForm = (
  field: CheckboxFieldBase,
): EditCheckboxInputs => {
  const nextValidationOptions = field.validateByValue
    ? {
        customMin: field.ValidationOptions.customMin?.toString() || '',
        customMax: field.ValidationOptions.customMax?.toString() || '',
      }
    : { customMin: '', customMax: '' }
  return {
    ...pick(field, EDIT_CHECKBOX_FIELD_KEYS),
    fieldOptions: SPLIT_TEXTAREA_TRANSFORM.input(field.fieldOptions),
    ValidationOptions: nextValidationOptions,
  }
}

const transformCheckboxEditFormToField = (
  inputs: EditCheckboxInputs,
  originalField: CheckboxFieldBase,
): CheckboxFieldBase => {
  const nextValidationOptions = inputs.validateByValue
    ? {
        // 0 is not allowed
        customMin: parseInt(inputs.ValidationOptions.customMin) || null,
        customMax: parseInt(inputs.ValidationOptions.customMax) || null,
      }
    : { customMin: null, customMax: null }
  return extend({}, originalField, inputs, {
    fieldOptions: SPLIT_TEXTAREA_TRANSFORM.output(inputs.fieldOptions),
    ValidationOptions: nextValidationOptions,
  })
}

export const EditCheckbox = ({ field }: EditCheckboxProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
    buttonText,
    handleUpdateField,
    watch,
    control,
    clearErrors,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditCheckboxInputs, CheckboxFieldBase>({
    field,
    transform: {
      input: transformCheckboxFieldToEditForm,
      output: transformCheckboxEditFormToField,
    },
  })

  const requiredValidationRule = useMemo(
    () => createBaseValidationRules({ required: true }),
    [],
  )

  const watchedInputs = watch()

  const optionsValidation = useCallback(
    (opts: string) => {
      const textareaValidation = SPLIT_TEXTAREA_VALIDATION.validate(opts)
      // Explicit check for !== true, since the error strings returned by the validator will also be truthy.
      if (textareaValidation !== true) return textareaValidation
      return DUPLICATE_OTHERS_VALIDATION(
        watchedInputs.othersRadioButton,
      ).validate(opts)
    },
    [watchedInputs.othersRadioButton],
  )

  const customMinValidationOptions: RegisterOptions = useMemo(
    () => ({
      required: {
        value:
          watchedInputs.validateByValue &&
          !watchedInputs.ValidationOptions.customMax,
        message: 'Please enter selection limits',
      },
      min: {
        value: 1,
        message: 'Cannot be less than 1',
      },
      max: {
        value: 10000,
        message: 'Cannot be more than 10,000',
      },
      validate: {
        minLargerThanMax: (val) => {
          return (
            !val ||
            !watchedInputs.validateByValue ||
            !watchedInputs.ValidationOptions.customMax ||
            Number(val) <= Number(watchedInputs.ValidationOptions.customMax) ||
            'Minimum cannot be larger than maximum'
          )
        },
        max: (val) => {
          let numOptions = SPLIT_TEXTAREA_TRANSFORM.output(
            watchedInputs.fieldOptions,
          ).length
          if (watchedInputs.othersRadioButton) {
            numOptions += 1
          }
          return (
            !val || val <= numOptions || 'Cannot be more than number of options'
          )
        },
      },
    }),
    [watchedInputs],
  )

  const customMaxValidationOptions: RegisterOptions = useMemo(
    () => ({
      required: {
        value:
          watchedInputs.validateByValue &&
          !watchedInputs.ValidationOptions.customMin,
        message: 'Please enter selection limits',
      },
      min: {
        value: 1,
        message: 'Cannot be less than 1',
      },
      max: {
        value: 10000,
        message: 'Cannot be more than 10,000',
      },
      validate: {
        maxLargerThanMin: (val) => {
          return (
            !val ||
            !watchedInputs.validateByValue ||
            !watchedInputs.ValidationOptions.customMin ||
            Number(val) >= Number(watchedInputs.ValidationOptions.customMin) ||
            'Maximum cannot be less than minimum'
          )
        },
        max: (val) => {
          if (!watchedInputs.validateByValue) return true
          let numOptions = SPLIT_TEXTAREA_TRANSFORM.output(
            watchedInputs.fieldOptions,
          ).length
          if (watchedInputs.othersRadioButton) {
            numOptions += 1
          }
          return (
            !val || val <= numOptions || 'Cannot be more than number of options'
          )
        },
      },
    }),
    [watchedInputs],
  )

  // Effect to clear validation option errors when selection limit is toggled off.
  useEffect(() => {
    if (!watchedInputs.validateByValue) {
      clearErrors('ValidationOptions')
    }
  }, [clearErrors, watchedInputs.validateByValue])

  return (
    <CreatePageDrawerContentContainer>
      <FormControl isRequired isReadOnly={isLoading} isInvalid={!!errors.title}>
        <FormLabel>Field Name</FormLabel>
        <Input autoFocus {...register('title', requiredValidationRule)} />
        <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading} isInvalid={!!errors.description}>
        <FormLabel>Description</FormLabel>
        <Textarea {...register('description')} />
        <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <Toggle {...register('required')} label="Required" />
      </FormControl>
      <FormControl isReadOnly={isLoading}>
        <Toggle
          {...register('othersRadioButton')}
          label={t('features.adminForm.sidebar.fields.radio.others')}
        />
      </FormControl>
      <FormControl
        isRequired
        isReadOnly={isLoading}
        isInvalid={!!errors.fieldOptions}
      >
        <FormLabel>
          {t('features.adminForm.sidebar.fields.radio.options.title')}
        </FormLabel>
        <Textarea
          placeholder={t(
            'features.adminForm.sidebar.fields.radio.options.placeholder',
          )}
          {...register('fieldOptions', {
            validate: optionsValidation,
          })}
        />
        <FormErrorMessage>{errors?.fieldOptions?.message}</FormErrorMessage>
      </FormControl>
      <Box>
        <Toggle
          {...register('validateByValue')}
          label={t(
            'features.adminForm.sidebar.fields.checkbox.selectionLimit.label',
          )}
          description={t(
            'features.adminForm.sidebar.fields.checkbox.selectionLimit.description',
          )}
        />
        <FormControl
          isDisabled={!watchedInputs.validateByValue}
          isReadOnly={isLoading}
          isInvalid={!isEmpty(errors.ValidationOptions)}
        >
          <SimpleGrid
            mt="0.5rem"
            columns={{ base: 1, sm: 2, md: 1, lg: 2 }}
            spacing="0.5rem"
          >
            <Controller
              name="ValidationOptions.customMin"
              control={control}
              rules={customMinValidationOptions}
              render={({ field: { onChange, ...rest } }) => (
                <NumberInput
                  inputMode="numeric"
                  precision={0}
                  flex={1}
                  showSteppers={false}
                  onChange={validateNumberInput(onChange)}
                  {...rest}
                  placeholder={t(
                    'features.adminForm.sidebar.fields.checkbox.selectionLimit.minimum',
                  )}
                />
              )}
            />
            <Controller
              name="ValidationOptions.customMax"
              control={control}
              rules={customMaxValidationOptions}
              render={({ field: { onChange, ...rest } }) => (
                <NumberInput
                  inputMode="numeric"
                  precision={0}
                  flex={1}
                  showSteppers={false}
                  onChange={validateNumberInput(onChange)}
                  {...rest}
                  placeholder={t(
                    'features.adminForm.sidebar.fields.checkbox.selectionLimit.maximum',
                  )}
                />
              )}
            />
          </SimpleGrid>
          <FormErrorMessage>
            {errors?.ValidationOptions?.customMin?.message ??
              errors?.ValidationOptions?.customMax?.message}
          </FormErrorMessage>
        </FormControl>
      </Box>
      <FormFieldDrawerActions
        isLoading={isLoading}
        buttonText={buttonText}
        handleClick={handleUpdateField}
        handleCancel={handleCancel}
      />
    </CreatePageDrawerContentContainer>
  )
}
