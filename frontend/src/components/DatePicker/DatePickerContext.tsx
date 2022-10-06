import React, {
  ChangeEventHandler,
  createContext,
  FocusEventHandler,
  MouseEventHandler,
  PropsWithChildren,
  RefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from 'react'
import {
  CSSObject,
  FormControlProps,
  useControllableState,
  useDisclosure,
  UseDisclosureReturn,
  useFormControlProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { format, isValid, parse } from 'date-fns'
import { zonedTimeToUtc } from 'date-fns-tz'

import { ThemeColorScheme } from '~theme/foundations/colours'
import { useIsMobile } from '~hooks/useIsMobile'

import { DatePickerProps } from './DatePicker'

interface DatePickerContextReturn {
  isMobile: boolean
  styles: Record<string, CSSObject>
  handleInputChange: ChangeEventHandler<HTMLInputElement>
  handleInputClick: MouseEventHandler<HTMLInputElement>
  handleDateChange: (date: Date | null) => void
  calendarButtonAria: string
  inputRef: RefObject<HTMLInputElement>
  initialFocusRef: RefObject<HTMLInputElement>
  handleInputBlur: FocusEventHandler<HTMLInputElement>
  fcProps: FormControlProps
  internalInputValue: string
  internalValue: Date | null
  closeCalendarOnChange: boolean
  placeholder: string
  allowManualInput: boolean
  colorScheme: ThemeColorScheme
  isDateUnavailable?: (date: Date) => boolean
  disclosureProps: UseDisclosureReturn
  monthsToDisplay?: number
}

const DatePickerContext = createContext<DatePickerContextReturn | null>(null)

export const DatePickerProvider = ({
  children,
  ...props
}: PropsWithChildren<DatePickerProps>) => {
  const value = useProvideDatePicker(props)
  return (
    <DatePickerContext.Provider value={value}>
      {children}
    </DatePickerContext.Provider>
  )
}

export const useDatePicker = () => {
  const context = useContext(DatePickerContext)
  if (!context) {
    throw new Error('useDatePicker must be used within a DatePickerProvider')
  }
  return context
}

const useProvideDatePicker = ({
  value,
  defaultValue,
  onChange,
  inputValue,
  defaultInputValue,
  onInputValueChange,
  displayFormat = 'dd/MM/yyyy',
  dateFormat = 'dd/MM/yyyy',
  isDisabled: isDisabledProp,
  isReadOnly: isReadOnlyProp,
  isRequired: isRequiredProp,
  isInvalid: isInvalidProp,
  timeZone = 'UTC',
  locale,
  isDateUnavailable,
  allowManualInput = true,
  allowInvalidDates = true,
  closeCalendarOnChange = true,
  onBlur,
  onClick,
  colorScheme = 'primary',
  monthsToDisplay,
  ...props
}: DatePickerProps): DatePickerContextReturn => {
  const isMobile = useIsMobile()
  const disclosureProps = useDisclosure()
  // Date typed values of the input.
  const [internalValue, setInternalValue] = useControllableState({
    defaultValue,
    value,
    onChange,
  })

  const formatInputValue = useCallback(
    (date: Date | null) => {
      if (!date || !isValid(date)) return ''
      return format(zonedTimeToUtc(date, timeZone), displayFormat, { locale })
    },
    [displayFormat, locale, timeZone],
  )

  // What is rendered as a string in the input according to given display format.
  const [internalInputValue, setInternalInputValue] = useControllableState({
    defaultValue: defaultInputValue ?? formatInputValue(internalValue),
    value: inputValue,
    onChange: onInputValueChange,
  })

  const fcProps = useFormControlProps({
    isInvalid: isInvalidProp,
    isDisabled: isDisabledProp,
    isReadOnly: isReadOnlyProp,
    isRequired: isRequiredProp,
    ...props,
  })

  const handleInputBlur: FocusEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const date = parse(
        internalInputValue,
        dateFormat,
        zonedTimeToUtc(new Date(), timeZone),
      )
      // Clear if input is invalid on blur if invalid dates are not allowed.
      if (!allowInvalidDates && !isValid(date)) {
        setInternalValue(null)
        setInternalInputValue('')
      }
      onBlur?.(e)
    },
    [
      allowInvalidDates,
      dateFormat,
      internalInputValue,
      onBlur,
      setInternalInputValue,
      setInternalValue,
      timeZone,
    ],
  )

  const initialFocusRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const calendarButtonAria = useMemo(() => {
    let ariaLabel = 'Select from date picker. '
    if (internalValue) {
      if (isValid(internalValue)) {
        ariaLabel += `Selected date is ${internalValue.toLocaleDateString()}.`
      } else {
        ariaLabel += 'The current selected date is invalid.'
      }
    }
    return ariaLabel
  }, [internalValue])

  const handleDateChange = useCallback(
    (date: Date | null) => {
      const zonedDate = date ? zonedTimeToUtc(date, timeZone) : null
      if (allowInvalidDates || isValid(zonedDate) || !zonedDate) {
        setInternalValue(zonedDate)
      }
      if (zonedDate) {
        setInternalInputValue(format(zonedDate, displayFormat, { locale }))
      } else {
        setInternalInputValue('')
      }
      closeCalendarOnChange && disclosureProps.onClose()
      // Refocus input after closing calendar.
      // Timeout is required so that the input is focused after the popover is closed.
      setTimeout(() => inputRef.current?.focus(), 0)
    },
    [
      allowInvalidDates,
      closeCalendarOnChange,
      disclosureProps,
      displayFormat,
      locale,
      setInternalInputValue,
      setInternalValue,
      timeZone,
    ],
  )

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const date = parse(
        event.target.value,
        dateFormat,
        zonedTimeToUtc(new Date(), timeZone),
      )
      setInternalInputValue(event.target.value)
      if (isValid(date)) {
        setInternalValue(date)
      }
    },
    [dateFormat, setInternalInputValue, setInternalValue, timeZone],
  )

  const handleInputClick: MouseEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (!allowManualInput) {
        e.stopPropagation()
        disclosureProps.onOpen()
      }
      onClick?.(e)
    },
    [allowManualInput, disclosureProps, onClick],
  )

  const styles = useMultiStyleConfig('DatePicker', {
    colorScheme,
  })

  const placeholder = useMemo(
    () => displayFormat.toLowerCase(),
    [displayFormat],
  )

  return {
    isMobile,
    styles,
    handleInputChange,
    handleInputClick,
    handleDateChange,
    calendarButtonAria,
    inputRef,
    initialFocusRef,
    handleInputBlur,
    fcProps,
    internalInputValue,
    internalValue,
    closeCalendarOnChange,
    placeholder,
    allowManualInput,
    colorScheme,
    isDateUnavailable,
    disclosureProps,
    monthsToDisplay,
  }
}
