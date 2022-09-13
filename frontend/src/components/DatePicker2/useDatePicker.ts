import React, {
  FocusEventHandler,
  MouseEventHandler,
  useCallback,
  useMemo,
  useRef,
} from 'react'
import {
  useControllableState,
  useDisclosure,
  useFormControlProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { format, isValid, parse } from 'date-fns'

import { DatePickerProps } from './DatePicker'

export const useDatePicker = ({
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
  locale,
  isDateUnavailable,
  allowManualInput = true,
  allowInvalidDates = true,
  closeCalendarOnChange = true,
  onBlur,
  onClick,
  colorScheme = 'primary',
  ...props
}: DatePickerProps) => {
  const disclosureProps = useDisclosure()
  const [internalValue, setInternalValue] = useControllableState({
    defaultValue,
    value,
    onChange,
  })

  const formatInputValue = useCallback(
    (date: Date | null) => {
      if (!date || !isValid(date)) return ''
      return format(date, dateFormat, { locale })
    },
    [dateFormat, locale],
  )

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
      const date = parse(internalInputValue, dateFormat, new Date())
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
    ],
  )

  const initialFocusRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const calendarButtonAria = useMemo(() => {
    let ariaLabel = 'Choose date. '
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
      if (allowInvalidDates || isValid(date) || !date) {
        setInternalValue(date)
      }
      if (date) {
        setInternalInputValue(format(date, displayFormat, { locale }))
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
    ],
  )

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const date = parse(event.target.value, dateFormat, new Date())
      setInternalInputValue(event.target.value)
      if (isValid(date)) {
        setInternalValue(date)
      }
    },
    [dateFormat, setInternalInputValue, setInternalValue],
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

  const styles = useMultiStyleConfig('DateInput', {
    colorScheme,
  })

  return {
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
    displayFormat,
    allowManualInput,
    colorScheme,
    isDateUnavailable,
    disclosureProps,
  }
}
