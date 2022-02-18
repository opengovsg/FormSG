import { useMemo } from 'react'
import { Controller, ControllerRenderProps } from 'react-hook-form'

import { createEmailValidationRules } from '~utils/fieldValidation'
import Input, { InputProps } from '~components/Input'

import { EmailFieldSchema } from './types'

export interface EmailFieldInputProps {
  schema: EmailFieldSchema
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
  handleInputChange,
  inputProps = {},
}: EmailFieldInputProps): JSX.Element => {
  const validationRules = useMemo(
    () => createEmailValidationRules(schema),
    [schema],
  )

  return (
    <Controller
      rules={validationRules}
      name={schema._id}
      render={({ field: { onChange, value, ...field } }) => (
        <Input
          autoComplete="email"
          value={value?.value}
          onChange={(event) => {
            const value = event.target.value
            return handleInputChange
              ? handleInputChange(onChange)(value)
              : onChange({ value })
          }}
          {...field}
          {...inputProps}
        />
      )}
    />
  )
}
