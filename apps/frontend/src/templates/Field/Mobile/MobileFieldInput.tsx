import {
  Controller,
  ControllerRenderProps,
  useFormContext,
} from 'react-hook-form'

import { useMobileValidationRules } from '~utils/fieldValidation'
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
  /**
   * Better visibility of values in the disabled component when set to true.
   */
  isHighContrast?: boolean
}

export const MobileFieldInput = ({
  schema,
  disableRequiredValidation,
  handleInputChange,
  phoneNumberInputProps = {},
  isHighContrast,
}: MobileFieldInputProps): JSX.Element => {
  const validationRules = useMobileValidationRules(
    schema,
    disableRequiredValidation,
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
          // Remove placeholder when field is disabled, to avoid confusion if
          // the field is prefilled or not (placeholder and prefill look similar)
          examplePlaceholder={schema.disabled ? 'off' : undefined}
          {...field}
          {...phoneNumberInputProps}
          isHighContrast={isHighContrast}
        />
      )}
    />
  )
}
