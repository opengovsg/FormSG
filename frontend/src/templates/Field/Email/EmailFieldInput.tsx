import { useMemo } from 'react'
import {
  Controller,
  ControllerRenderProps,
  useFormContext,
} from 'react-hook-form'

import { FormResponseMode } from '~shared/types'

import { createEmailValidationRules } from '~utils/fieldValidation'
import Input, { InputProps } from '~components/Input'

import { EmailFieldSchema, VerifiableFieldInput } from '../types'

export interface EmailFieldInputProps {
  schema: EmailFieldSchema
  responseMode: FormResponseMode
  /**
   * If available, will wrap controller's onChange with this function.
   */
  handleInputChange?: (
    onChange: ControllerRenderProps['onChange'],
  ) => (value?: string) => void
  /** Any props to override internal input */
  inputProps?: Partial<InputProps>
}

export const EmailFieldInput = ({
  schema,
  responseMode,
  handleInputChange,
  inputProps = {},
}: EmailFieldInputProps): JSX.Element => {
  const validationRules = useMemo(
    () => createEmailValidationRules(schema, responseMode),
    [schema, responseMode],
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
