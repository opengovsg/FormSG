import { useMemo } from 'react'
import {
  Controller,
  ControllerRenderProps,
  useFormContext,
} from 'react-hook-form'
import { Input, InputProps } from '@opengovsg/design-system-react'

import { createEmailValidationRules } from '~utils/fieldValidation'

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
}

export const EmailFieldInput = ({
  schema,
  disableRequiredValidation,
  handleInputChange,
  inputProps = {},
}: EmailFieldInputProps): JSX.Element => {
  const validationRules = useMemo(
    () => createEmailValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
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
