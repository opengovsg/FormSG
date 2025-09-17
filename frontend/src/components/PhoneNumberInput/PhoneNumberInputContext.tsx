import {
  ChangeEventHandler,
  createContext,
  MutableRefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react'
import {
  AsYouType,
  CountryCode,
  getCountryCallingCode,
  NationalNumber,
} from 'libphonenumber-js'
import defaultExamples from 'libphonenumber-js/examples.mobile.json'

type PhoneNumberInputContextProps = {
  value: string
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
}

type PhoneNumberInputContextReturn = {
  inputValue: string
  country: CountryCode
  innerInputRef: MutableRefObject<HTMLInputElement | null>
  handleInputChange: ChangeEventHandler<HTMLInputElement>
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
  value,
  defaultCountry,
  examplePlaceholder,
  examples = defaultExamples,
  allowInternational,
  onChange,
  ...props
}: PhoneNumberInputContextProps): PhoneNumberInputContextReturn => {
  // Refs of the phone number input so focus can be passed to the input when
  // the selected country changes.
  const innerInputRef = useRef<HTMLInputElement | null>(null)

  const currentNumber = useMemo(() => {
    const asYouType = new AsYouType()
    asYouType.reset()
    asYouType.input(value)
    const country = asYouType.getCountry()
    const inputValue = asYouType.getNationalNumber()
    return {
      country,
      inputValue,
    }
  }, [value])

  const { inputValue = '', country = defaultCountry } = currentNumber

  const inputPlaceholder = useMemo(() => {
    if (examplePlaceholder === 'off') {
      return props.placeholder
    }
  }, [examplePlaceholder, props.placeholder])

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const countryToUse = allowInternational ? country : defaultCountry
      const newValue = e.target.value
      const nextValue = `+${getCountryCallingCode(countryToUse)}${newValue}`
      onChange(nextValue)
    },
    [allowInternational, onChange, country, defaultCountry],
  )

  const handleCountryChange = useCallback(
    (newCountry: CountryCode) => {
      if (!allowInternational) {
        return
      }
      const nextValue = `+${getCountryCallingCode(newCountry)}${inputValue}`
      onChange(nextValue)
      innerInputRef?.current?.focus()
    },
    [inputValue, onChange],
  )

  return {
    inputValue,
    country,
    innerInputRef,
    handleInputChange,
    handleCountryChange,
    inputPlaceholder,
  }
}
