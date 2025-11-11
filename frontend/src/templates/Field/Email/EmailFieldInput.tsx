import {
  Controller,
  ControllerRenderProps,
  get,
  useFormContext,
  useFormState,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Text } from '@chakra-ui/react'

import { Language } from '~shared/types'

import { useEmailValidationRules } from '~utils/fieldValidation'
import Input, { InputProps } from '~components/Input'

import { EmailFieldSchema, VerifiableFieldInput } from '../types'

export interface EmailFieldInputProps {
  schema: EmailFieldSchema
  disableRequiredValidation?: boolean
  /**
   * If available, will wrap controller's onChange with this function.
   */
  handleInputChange?: (
    onChange: ControllerRenderProps['onChange'],
  ) => (value?: string) => void
  /** Any props to override internal input */
  inputProps?: Partial<InputProps>
  selectedLanguage?: Language
  /**
   * Better visibility of values in the disabled component when set to true.
   */
  isHighContrast?: boolean
}

export const EmailFieldInput = ({
  schema,
  disableRequiredValidation,
  handleInputChange,
  inputProps = {},
  isHighContrast,
}: EmailFieldInputProps): JSX.Element => {
  const { t } = useTranslation()
  const { errors } = useFormState({ name: schema._id })
  // TODO: decide how to combine with field-validations en-sg.ts
  const validationErrorMessages = t(
    'features.publicForm.components.fields.email.validation',
    { allowObjects: true },
  )

  const validationRules = useEmailValidationRules(
    schema,
    disableRequiredValidation,
    validationErrorMessages,
  )

  const { control } = useFormContext<VerifiableFieldInput>()
  const error = !!get(errors, schema._id)

  return (
    <Controller
      control={control}
      rules={validationRules}
      name={schema._id}
      defaultValue={{ value: '' }}
      render={({ field: { onChange, value, ...field } }) => (
        <>
          <Input
            autoComplete="email"
            value={value?.value ?? ''}
            onChange={(event) => {
              const value = event.target.value.trim().toLowerCase()
              return handleInputChange
                ? handleInputChange(onChange)(value)
                : onChange({ value })
            }}
            isHighContrast={isHighContrast}
            preventDefaultOnEnter
            {...field}
            {...inputProps}
          />
          {schema.autoReplyOptions?.includeFormSummary && !schema.disabled && !error ? (
            <Text
              color="secondary.400"
              textStyle="body-2"
              aria-hidden
              my="0.5rem"
            >
              {t(
                'features.publicForm.components.fields.email.respondentCopyHelperText',
              )}
            </Text>
          ) : null}
        </>
      )}
    />
  )
}
