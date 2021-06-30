/**
 * Phone Number Input field component.
 * Some of the code is sourced from
 * https://www.npmjs.com/package/react-headless-phone-input but adapted for the
 * application's needs.
 */
import {
  FC,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { BiChevronDown } from 'react-icons/bi'
import {
  Box,
  chakra,
  Flex,
  forwardRef,
  Icon,
  InputGroup,
  InputLeftAddon,
  InputProps,
  useMergeRefs,
} from '@chakra-ui/react'
import Flags from 'country-flag-icons/react/3x2'
import { AsYouType, CountryCode } from 'libphonenumber-js/min'

import Input from '../Input'

import { COUNTRY_CODE_TO_NAME } from './utils/mapCountryCodeToName'

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
    { defaultCountry = 'SG', onChange, onBlur, value: propsValue, ...props },
    ref,
  ) => {
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
        <CountrySelect value={country} onChange={onCountryChange} />
        <Input
          onBlur={onInputBlur}
          borderLeftRadius={0}
          ref={inputRef}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          type="tel"
          {...props}
        />
      </InputGroup>
    )
  },
)

interface CountrySelectProps {
  value: CountryCode
  onChange: (val: CountryCode) => void
}

const CountrySelect: FC<CountrySelectProps> = ({ value, onChange }) => {
  return (
    <InputLeftAddon
      title={COUNTRY_CODE_TO_NAME[value]}
      as="label"
      transitionProperty="common"
      transitionDuration="normal"
      bg="white"
      border="1px solid"
      borderColor="neutral.400"
      _active={{
        borderColor: 'primary.500',
        boxShadow: `0 0 0 1px var(--chakra-colors-primary-500)`,
      }}
      _focusWithin={{
        borderColor: 'primary.500',
        zIndex: 1,
        boxShadow: `0 0 0 1px var(--chakra-colors-primary-500)`,
      }}
      _hover={{ bg: 'neutral.200' }}
      pos="relative"
      p="0.5rem"
      width="4rem"
    >
      <Flex>
        {value ? <Icon as={Flags[value]} w="1.5em" /> : <Box w="1.5em" />}
        <Icon ml="0.5rem" as={BiChevronDown} />
      </Flex>
      <chakra.select
        aria-label="Country selector"
        cursor="pointer"
        opacity={0}
        pos="absolute"
        w="100%"
        h="100%"
        left={0}
        top={0}
        value={value}
        onChange={(event) => onChange(event.target.value as CountryCode)}
      >
        {Object.keys(COUNTRY_CODE_TO_NAME).map((country) => (
          <option key={country} value={country}>
            {COUNTRY_CODE_TO_NAME[country as CountryCode]}
          </option>
        ))}
      </chakra.select>
    </InputLeftAddon>
  )
}
