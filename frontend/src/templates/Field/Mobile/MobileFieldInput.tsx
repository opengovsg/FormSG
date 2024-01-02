import { useMemo } from 'react'
import {
  Controller,
  ControllerRenderProps,
  useFormContext,
} from 'react-hook-form'

import { createMobileValidationRules } from '~utils/fieldValidation'
import PhoneNumberInput, {
  PhoneNumberInputProps,
} from '~components/PhoneNumberInput'

import { MobileFieldSchema, VerifiableFieldInput } from '../types'

export interface MobileFieldInputProps {
  schema: MobileFieldSchema
  disableRequiredValidation?: boolean
  /**
   * If available, will wrap controller's onChange with this function.
   */
  handleInputChange?: (
    onChange: ControllerRenderProps['onChange'],
  ) => (value?: string) => void
  /** Any props to override internal input */
  phoneNumberInputProps?: Partial<PhoneNumberInputProps>
}

export const MobileFieldInput = ({
  schema,
  disableRequiredValidation,
  handleInputChange,
  phoneNumberInputProps = {},
}: MobileFieldInputProps): JSX.Element => {
  const validationRules = useMemo(
    () => createMobileValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  const { control } = useFormContext<VerifiableFieldInput>()

  return (
    <Controller
      control={control}
      rules={validationRules}
      name={schema._id}
      render={({ field: { onChange, value, ...field } }) => (
        <PhoneNumberInput
          autoComplete="tel"
          allowInternational={schema.allowIntlNumbers}
          value={value?.value}
          onChange={
            handleInputChange
              ? handleInputChange(onChange)
              : (value) => onChange({ value })
          }
          {...field}
          {...phoneNumberInputProps}
        />
      )}
    />
  )
}
