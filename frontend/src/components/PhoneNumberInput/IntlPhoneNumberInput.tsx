/**
 * Phone Number Input field component.
 * Some of the code is sourced from
 * https://www.npmjs.com/package/react-headless-phone-input but adapted for the
 * application's needs.
 */
import { ChangeEvent, FC, useCallback, useMemo } from 'react'
import { BiChevronDown } from 'react-icons/bi'
import {
  chakra,
  Flex,
  forwardRef,
  Icon,
  InputGroup,
  InputLeftAddon,
  useFormControl,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import Flags from 'country-flag-icons/react/3x2'
import { CountryCode } from 'libphonenumber-js/min'

import Input from '../Input'

import {
  COUNTRY_CODE_TO_NAME,
  getCountrySelectOptions,
} from './utils/countrySelectUtils'
import { BasePhoneNumberInputProps } from './PhoneNumberInput'
import { usePhoneNumberInput } from './PhoneNumberInputContext'

export const IntlPhoneNumberInput = forwardRef<
  BasePhoneNumberInputProps,
  'input'
>((props, ref) => {
  const {
    inputValue,
    innerInputRef,
    inputPlaceholder,
    handleInputChange,
    handleInputBlur,
  } = usePhoneNumberInput()

  const styles = useMultiStyleConfig('PhoneNumberInput', props)

  // Used so any forwarded refs passed can be merged with internal ref.
  const inputRef = useMergeRefs(innerInputRef, ref)

  return (
    <InputGroup>
      <CountrySelect
        isReadOnly={props.isReadOnly}
        isDisabled={props.isDisabled}
      />
      <Input
        onBlur={handleInputBlur}
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        type="tel"
        sx={styles.field}
        preventDefaultOnEnter
        {...props}
        placeholder={inputPlaceholder}
      />
    </InputGroup>
  )
})

interface CountrySelectProps {
  isDisabled?: boolean
  isReadOnly?: boolean
}

const CountrySelect: FC<CountrySelectProps> = (props) => {
  const { country, handleCountryChange } = usePhoneNumberInput()
  const styles = useMultiStyleConfig('PhoneNumberInput', props)

  const onCountryChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      handleCountryChange(e.target.value as CountryCode)
    },
    [handleCountryChange],
  )

  const inputProps = useFormControl<HTMLSelectElement>(props)

  const selectOptions = useMemo(() => getCountrySelectOptions(), [])

  return (
    <InputLeftAddon
      aria-disabled={inputProps.disabled}
      title={COUNTRY_CODE_TO_NAME[country]}
      as="label"
      sx={styles.country}
    >
      <Flex>
        <Icon
          aria-disabled={inputProps.disabled}
          aria-readonly={inputProps.readOnly}
          // Show Flags if available. If value does not exist for any reason,
          // a default fallback icon will be used by ChakraUI.
          // See https://chakra-ui.com/docs/media-and-icons/icon#fallback-icon.
          as={Flags[country]}
          sx={styles.icon}
        />
        <Icon as={BiChevronDown} />
      </Flex>
      <chakra.select
        aria-label="Country selector"
        sx={styles.selector}
        {...inputProps}
        disabled={inputProps.disabled || inputProps.readOnly}
        value={country}
        id={`${inputProps.id}-country`}
        // Override props on change with one that takes in ChangeEvent as a param.
        onChange={onCountryChange}
      >
        {selectOptions.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </chakra.select>
    </InputLeftAddon>
  )
}
