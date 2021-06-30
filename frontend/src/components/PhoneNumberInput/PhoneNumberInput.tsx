/**
 * Phone Number Input field component.
 * Some of the code is sourced from
 * https://www.npmjs.com/package/react-headless-phone-input but adapted for the
 * application's needs.
 */
import {
  ChangeEvent,
  FC,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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
import { AsYouType, CountryCode } from 'libphonenumber-js/min'

import Input, { InputProps } from '../Input'

import {
  COUNTRY_CODE_TO_NAME,
  getCountrySelectOptions,
} from './utils/countrySelectUtils'

export interface PhoneNumberInputProps
  extends Omit<InputProps, 'defaultValue' | 'value' | 'onChange'> {
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
}

export const PhoneNumberInput = forwardRef<PhoneNumberInputProps, 'input'>(
  (
    {
      defaultCountry = 'SG',
      onChange,
      onBlur,
      value: propsValue,
      isDisabled,
      ...props
    },
    ref,
  ) => {
    const styles = useMultiStyleConfig('PhoneNumberInput', props)

    // Internal states of the component.
    const [inputValue, setInputValue] = useState(propsValue ?? '')
    const [country, setCountry] = useState(defaultCountry)

    // Refs of the phone number input so focus can be passed to the input when
    // the selected country changes.
    const innerInputRef = useRef<HTMLInputElement | null>(null)
    // Used so any forwarded refs passed can be merged with internal ref.
    const inputRef = useMergeRefs(innerInputRef, ref)

    const formatter = useMemo(() => new AsYouType(country), [country])

    const onInputChange = useCallback(
      (newValue: string) => {
        if (inputValue === newValue) return

        // The as-you-type formatter only works with append-only inputs.
        // Changes other than append require a reset.
        const isAppend =
          newValue.length > inputValue.length &&
          newValue.slice(0, inputValue.length) === inputValue

        if (isAppend) {
          const appended = newValue.slice(inputValue.length)
          setInputValue(formatter.input(appended))

          const number = formatter.getNumber()
          if (number?.country && number.country !== country) {
            setCountry(number.country)
          }
        } else {
          // Reset the formatter, but do not reformat.
          // Doing so now will cause the user to loose their cursor position
          // Wait until blur or append to reformat.
          formatter.reset()
          formatter.input(newValue)
          setInputValue(newValue)
        }

        const number = formatter.getNumber()

        const e164 = number?.number as string | undefined
        onChange(e164)

        // On a similar vein, do not set country even if the country has changed
        // so that the cursor position does not get lost.
        // Change country on blur instead.
      },
      [country, formatter, inputValue, onChange],
    )

    const onCountryChange = useCallback(
      (newCountry: CountryCode) => {
        if (country === newCountry) return
        onInputChange('')
        setCountry(newCountry)
        innerInputRef?.current?.focus()
      },
      [country, onInputChange],
    )

    const onInputBlur = useCallback(() => {
      const number = formatter.getNumber()
      onBlur?.()

      onChange(number?.number as string | undefined)
      // Check and update possibility
      const possible = number?.isPossible()

      if (number && possible) {
        // Reformat the phone number as international
        formatter.reset()
        setInputValue(formatter.input(number.number as string))
        // Update the country if the parsed number belongs to a different
        // country.
        if (number?.country && number.country !== country) {
          setCountry(number.country)
        }
      } else {
        // Format the phone number
        setInputValue(formatter.input(''))
      }
    }, [country, formatter, onBlur, onChange])

    // useLayoutEffect used instead of useEffect so this only runs after
    // the render cycle has been completed.
    // This allows the cursor position to be updated after formatting the input
    // without "jumping" to the end of the input string and disrupting the user.
    useLayoutEffect(() => {
      const number = formatter.getNumber()?.number

      if (number !== propsValue) {
        // Override the phone number if the field has a number and its e164
        // representation does not match the prop value.
        formatter.reset()
        setInputValue(propsValue ? formatter.input(propsValue) : '')

        const number = formatter.getNumber()

        const e164 = number?.number as string | undefined
        onChange(e164)
        // Update the country if the parsed number belongs to a different
        // country.
        if (number?.country && number.country !== country) {
          setCountry(number.country)
        }
      }
    }, [propsValue, formatter, inputValue, onChange, country])

    return (
      <InputGroup>
        <CountrySelect
          isDisabled={isDisabled}
          value={country}
          onChange={onCountryChange}
        />
        <Input
          onBlur={onInputBlur}
          ref={inputRef}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          type="tel"
          isDisabled={isDisabled}
          sx={styles.field}
          {...props}
        />
      </InputGroup>
    )
  },
)

interface CountrySelectProps {
  value: CountryCode
  onChange: (val: CountryCode) => void
  isDisabled?: boolean
}

const CountrySelect: FC<CountrySelectProps> = (props) => {
  const { value, onChange } = props
  const styles = useMultiStyleConfig('PhoneNumberInput', props)

  const handleCountryChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value as CountryCode)
    },
    [onChange],
  )

  const inputProps = useFormControl<HTMLSelectElement>(props)

  const selectOptions = useMemo(() => getCountrySelectOptions(), [])

  return (
    <InputLeftAddon
      aria-disabled={inputProps.disabled}
      title={COUNTRY_CODE_TO_NAME[value]}
      as="label"
      sx={styles.country}
    >
      <Flex>
        <Icon
          aria-disabled={inputProps.disabled}
          // Show FLags if available. If value does not exist for any reason,
          // a default fallback icon will be used by ChakraUI.
          // See https://chakra-ui.com/docs/media-and-icons/icon#fallback-icon.
          as={Flags[value]}
          sx={styles.icon}
        />
        <Icon as={BiChevronDown} />
      </Flex>
      <chakra.select
        aria-label="Country selector"
        sx={styles.selector}
        {...inputProps}
        id={`${inputProps.id}-country`}
        // Override props on change with one that takes in ChangeEvent as a param.
        onChange={handleCountryChange}
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
