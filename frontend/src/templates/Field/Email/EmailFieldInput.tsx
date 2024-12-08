import { useMemo } from 'react'
import {
  Controller,
  ControllerRenderProps,
  useFormContext,
} from 'react-hook-form'

import { Language } from '~shared/types'

import { createEmailValidationRules } from '~utils/fieldValidation'
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
}

export const EmailFieldInput = ({
  schema,
  disableRequiredValidation,
  handleInputChange,
  inputProps = {},
  selectedLanguage = Language.ENGLISH,
}: EmailFieldInputProps): JSX.Element => {
  const validationRules = useMemo(
    () =>
      createEmailValidationRules(
        schema,
        disableRequiredValidation,
        selectedLanguage,
      ),
    [schema, disableRequiredValidation, selectedLanguage],
  )

  const { control } = useFormContext<VerifiableFieldInput>()

  return (
    <Controller
      control={control}
      rules={validationRules}
      name={schema._id}
      defaultValue={{ value: '' }}
      render={({ field: { onChange, value, ...field } }) => (
        <Input
          autoComplete="email"
          value={value?.value ?? ''}
          onChange={(event) => {
            const value = event.target.value.trim().toLowerCase()
            return handleInputChange
              ? handleInputChange(onChange)(value)
              : onChange({ value })
          }}
          preventDefaultOnEnter
          {...field}
          {...inputProps}
        />
      )}
    />
  )
}
