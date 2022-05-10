import {
  ChangeEventHandler,
  createContext,
  MutableRefObject,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  AsYouType,
  CountryCode,
  getExampleNumber,
  NationalNumber,
} from 'libphonenumber-js'
import defaultExamples from 'libphonenumber-js/examples.mobile.json'

type PhoneNumberInputContextProps = {
  defaultValue?: string
  defaultCountry: CountryCode
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
  placeholder?: string
  /**
   * Whether international phone numbers are allowed. Defaults to `true`.
   * If allowed, the phone number input will be prefixed with the country code,
   * and the selected country will be displayed in the input's left add-on, and
   * autoformatting will be enabled.
   */
  allowInternational?: boolean

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
}

type PhoneNumberInputContextReturn = {
  inputValue: string
  country: CountryCode
  innerInputRef: MutableRefObject<HTMLInputElement | null>
  handleInputChange: ChangeEventHandler<HTMLInputElement>
  handleInputBlur: () => void
  handleCountryChange: (newCountry: CountryCode) => void
  inputPlaceholder: string | undefined
  isDisabled?: boolean
}

const PhoneNumberInputContext = createContext<
  PhoneNumberInputContextReturn | undefined
>(undefined)

export type PhoneNumberInputProviderProps = PhoneNumberInputContextProps & {
  children?: React.ReactNode
}

/**
 * Provider component that makes context object available to any
 * child component that calls `usePhoneNumberInput()`.
 */
export const PhoneNumberInputProvider = ({
  children,
  ...contextProps
}: PhoneNumberInputProviderProps): JSX.Element => {
  const context = useProvidePhoneNumberInput(contextProps)

  return (
    <PhoneNumberInputContext.Provider value={context}>
      {children}
    </PhoneNumberInputContext.Provider>
  )
}

/**
 * Hook for components nested in PhoneNumberProvider component to get the
 * current context object.
 */
export const usePhoneNumberInput = (): PhoneNumberInputContextReturn => {
  const context = useContext(PhoneNumberInputContext)
  if (!context) {
    throw new Error(
      `usePhoneNumber must be used within a PhoneNumberProvider component`,
    )
  }
  return context
}

const useProvidePhoneNumberInput = ({
  defaultValue,
  defaultCountry,
  examplePlaceholder,
  examples = defaultExamples,
  allowInternational,
  onChange,
  onBlur,
  ...props
}: PhoneNumberInputContextProps): PhoneNumberInputContextReturn => {
  // Internal states of the component.
  const [inputValue, setInputValue] = useState(defaultValue ?? '')
  const [country, setCountry] = useState(defaultCountry)

  // Refs of the phone number input so focus can be passed to the input when
  // the selected country changes.
  const innerInputRef = useRef<HTMLInputElement | null>(null)

  const formatter = useMemo(() => new AsYouType(country), [country])

  const inputPlaceholder = useMemo(() => {
    if (examplePlaceholder === 'off') {
      return props.placeholder
    }

    const exampleNumber = getExampleNumber(country, examples)?.formatNational()

    if (examplePlaceholder === 'aggressive') {
      return exampleNumber ?? props.placeholder
    }

    return props.placeholder ?? exampleNumber
  }, [country, examplePlaceholder, examples, props.placeholder])

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

        if (allowInternational) {
          const number = formatter.getNumber()
          if (number?.country && number.country !== country) {
            setCountry(number.country)
          }
        }
      } else {
        // Reset the formatter, but do not reformat.
        // Doing so now will cause the user to lose their cursor position
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
    [country, formatter, inputValue, allowInternational, onChange],
  )

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      let newValue = e.target.value
      if (!allowInternational) {
        // Remove all non-numeric, non-space characters so country cannot be
        // changed.
        newValue = newValue.replace(/[^\d ]/g, '')
      }
      return onInputChange(newValue)
    },
    [allowInternational, onInputChange],
  )

  const handleCountryChange = useCallback(
    (newCountry: CountryCode) => {
      if (country === newCountry) return
      onInputChange('')
      setCountry(newCountry)
      innerInputRef?.current?.focus()
    },
    [country, onInputChange],
  )

  const handleFormatInput = useCallback(() => {
    const number = formatter.getNumber()

    // Trigger on change again in case formatted number changes.
    // This can happen in the following scenario:
    // 1. `onInputChange` gets called when user types for example "65aabvcd123"
    // 2. `formatter.getNumber().number` will transform that into "65" and cut out the remaining characters since the remaining string is not a valid number
    // 3. Will need to call onChange on this new number.
    onChange(number?.number as string | undefined)
    // Check and update possibility
    const possible = number?.isPossible()

    if (number && possible) {
      // Reformat the phone number as international if international numbers
      // are enabled.
      formatter.reset()
      const nextValue = allowInternational
        ? number.number
        : number.nationalNumber
      setInputValue(formatter.input(nextValue as string))
      // Update the country if the parsed number belongs to a different
      // country.
      if (allowInternational && number?.country && number.country !== country) {
        setCountry(number.country)
      }
    } else {
      // Format the phone number
      setInputValue(formatter.input(''))
    }
  }, [country, formatter, allowInternational, onChange])

  const handleInputBlur = useCallback(() => {
    onBlur?.()
    handleFormatInput()
  }, [handleFormatInput, onBlur])

  // useLayoutEffect used instead of useEffect so this only runs after
  // the render cycle has been completed.
  // This allows the cursor position to be updated after formatting the input
  // without "jumping" to the end of the input string and disrupting the user.
  useLayoutEffect(() => {
    const number = formatter.getNumber()?.number

    if (number !== defaultValue) {
      // Override the phone number if the field has a number and its e164
      // representation does not match the prop value.
      formatter.reset()
      if (defaultValue) {
        formatter.input(defaultValue)
      }
      handleFormatInput()
    }
  }, [
    defaultValue,
    formatter,
    inputValue,
    onChange,
    country,
    allowInternational,
    handleFormatInput,
  ])

  return {
    inputValue,
    country,
    innerInputRef,
    handleInputChange,
    handleInputBlur,
    handleCountryChange,
    inputPlaceholder,
  }
}
