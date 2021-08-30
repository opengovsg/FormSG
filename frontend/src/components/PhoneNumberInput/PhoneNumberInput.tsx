/**
 * Phone Number Input field component.
 * Some of the code is sourced from
 * https://www.npmjs.com/package/react-headless-phone-input but adapted for the
 * application's needs.
 */
import { forwardRef } from '@chakra-ui/react'
import defaultExamples from 'libphonenumber-js/examples.mobile.json'
import { CountryCode, NationalNumber } from 'libphonenumber-js/min'

import { InputProps } from '../Input'

import { IntlPhoneNumberInput } from './IntlPhoneNumberInput'
import { LocalPhoneNumberInput } from './LocalPhoneNumberInput'
import {
  PhoneNumberProvider,
  PhoneNumberProviderProps,
} from './PhoneNumberContext'

export type BasePhoneNumberInputProps = Omit<
  InputProps,
  'defaultValue' | 'value' | 'onChange'
>

export interface PhoneNumberInputProps extends BasePhoneNumberInputProps {
  /**
   * The default country to instantiate the component to.
   * Affects the formatting of the phone number.
   */
  defaultCountry?: CountryCode
  /**
   * Callback that will be called when the value in the phone number input field
   * changes.
   */
  onChange: (val: string | undefined) => void
  /**
   * Optional. Callback that will be called when the phone number input field is
   * blurred.
   */
  onBlur?: () => void
  /**
   * The current value of the controlled component.
   */
  value: string | undefined

  /**
   * Set the input's placeholder to an example number for the selected country,
   * and update it if the country changes.
   *
   * By default it is set to "polite", which means it will only set the
   * placeholder if the input doesn't already have one. You can also set it to
   * "aggressive", which will replace any existing placeholder, or "off" to not
   * show any example numbers in the placeholder.
   */
  examplePlaceholder?: 'polite' | 'aggressive' | 'off'

  /**
   * Examples to retrieve placeholder number from, if any. Defaults to
   * `libphonenumber-js/examples.mobile.json` if none provided.
   */
  examples?: { [country in CountryCode]: NationalNumber }

  /**
   * Whether international phone numbers are allowed. Defaults to `true`.
   * If allowed, the phone number input will be prefixed with the country code,
   * and the selected country will be displayed in the input's left add-on, and
   * autoformatting will be enabled.
   */
  isAllowInternational?: boolean
}

export const PhoneNumberInput = forwardRef<PhoneNumberInputProps, 'input'>(
  (
    {
      defaultCountry = 'SG',
      isAllowInternational = true,
      onChange,
      onBlur,
      value,
      examples = defaultExamples,
      examplePlaceholder = 'polite',
      ...props
    },
    ref,
  ) => {
    const providerProps: PhoneNumberProviderProps = {
      defaultCountry,
      isAllowInternational,
      onChange,
      onBlur,
      defaultValue: value,
      examples,
      examplePlaceholder,
      placeholder: props.placeholder,
    }

    return (
      <PhoneNumberProvider {...providerProps}>
        {isAllowInternational ? (
          <IntlPhoneNumberInput {...props} ref={ref} />
        ) : (
          <LocalPhoneNumberInput {...props} ref={ref} />
        )}
      </PhoneNumberProvider>
    )
  },
)
