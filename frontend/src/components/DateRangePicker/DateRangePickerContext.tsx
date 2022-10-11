import {
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
  useState,
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
import { DateRangeValue } from '~components/Calendar'

import { DateRangePickerProps } from './DateRangePicker'

interface DateRangePickerContextReturn {
  isMobile: boolean
  styles: Record<string, CSSObject>
  handleStartDateChange: ChangeEventHandler<HTMLInputElement>
  handleEndDateChange: ChangeEventHandler<HTMLInputElement>
  handleCalendarDateChange: (value: DateRangeValue) => void
  handleFieldContainerClick: () => void
  handleInputClick: MouseEventHandler<HTMLInputElement>
  calendarButtonAria: string
  startInputRef: RefObject<HTMLInputElement>
  endInputRef: RefObject<HTMLInputElement>
  initialFocusRef: RefObject<HTMLInputElement>
  handleInputBlur: FocusEventHandler<HTMLInputElement>
  fcProps: FormControlProps
  internalValue: DateRangeValue
  startInputDisplay: string
  endInputDisplay: string
  closeCalendarOnChange: boolean
  placeholder: string
  allowManualInput: boolean
  isDateUnavailable?: (date: Date) => boolean
  disclosureProps: UseDisclosureReturn
  labelSeparator: string
  colorScheme: ThemeColorScheme
  monthsToDisplay?: number
}

const DateRangePickerContext =
  createContext<DateRangePickerContextReturn | null>(null)

export const DateRangePickerProvider = ({
  children,
  ...props
}: PropsWithChildren<DateRangePickerProps>) => {
  const value = useProvideDateRangePicker(props)
  return (
    <DateRangePickerContext.Provider value={value}>
      {children}
    </DateRangePickerContext.Provider>
  )
}

export const useDateRangePicker = () => {
  const context = useContext(DateRangePickerContext)
  if (!context) {
    throw new Error(
      'useDateRangePicker must be used within a DateRangePickerProvider',
    )
  }
  return context
}

const useProvideDateRangePicker = ({
  value,
  defaultValue = [null, null],
  onChange,
  labelSeparator = 'to',
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
  refocusOnClose = true,
  ...props
}: DateRangePickerProps): DateRangePickerContextReturn => {
  const initialFocusRef = useRef<HTMLInputElement>(null)
  const startInputRef = useRef<HTMLInputElement>(null)
  const endInputRef = useRef<HTMLInputElement>(null)

  const isMobile = useIsMobile()

  const disclosureProps = useDisclosure({
    onClose: () => {
      if (!refocusOnClose) return
      // Refocus input after closing calendar.
      setTimeout(() => endInputRef.current?.focus(), 0)
    },
  })

  const [internalValue, setInternalValue] = useControllableState({
    defaultValue,
    value,
    onChange,
  })
  const [startDate, endDate] = internalValue

  // What is rendered as a string in the start date range input according to given display format.
  const [startInputDisplay, setStartInputDisplay] = useState(
    startDate && isValid(startDate)
      ? format(zonedTimeToUtc(startDate, timeZone), displayFormat, { locale })
      : '',
  )
  // What is rendered as a string in the end date range input according to given display format.
  const [endInputDisplay, setEndInputDisplay] = useState(
    endDate && isValid(endDate)
      ? format(zonedTimeToUtc(endDate, timeZone), displayFormat, { locale })
      : '',
  )

  const handleUpdateInputs = useCallback(
    (nextRange: DateRangeValue) => {
      const sortedRange = nextRange.sort((a, b) =>
        a && b ? a.getTime() - b.getTime() : 0,
      )

      // Replace invalid dates with null
      const validRange = sortedRange.map((date) =>
        isValid(date) ? date : null,
      ) as DateRangeValue

      const [nextStart, nextEnd] = sortedRange
      const zonedStartDate = nextStart
        ? zonedTimeToUtc(nextStart, timeZone)
        : null
      const zonedEndDate = nextEnd ? zonedTimeToUtc(nextEnd, timeZone) : null
      if (zonedStartDate) {
        if (isValid(zonedStartDate)) {
          setStartInputDisplay(
            format(zonedStartDate, displayFormat, { locale }),
          )
        } else if (!allowInvalidDates) {
          setStartInputDisplay('')
        }
      } else {
        setStartInputDisplay('')
      }
      if (zonedEndDate) {
        if (isValid(zonedEndDate)) {
          setEndInputDisplay(format(zonedEndDate, displayFormat, { locale }))
        } else if (!allowInvalidDates) {
          setEndInputDisplay('')
        }
      } else {
        setEndInputDisplay('')
      }
      setInternalValue(validRange)
    },
    [allowInvalidDates, displayFormat, locale, setInternalValue, timeZone],
  )

  const fcProps = useFormControlProps({
    isInvalid: isInvalidProp,
    isDisabled: isDisabledProp,
    isReadOnly: isReadOnlyProp,
    isRequired: isRequiredProp,
    ...props,
  })

  const handleInputBlur: FocusEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const startDate = parse(startInputDisplay, dateFormat, new Date())
      const endDate = parse(endInputDisplay, dateFormat, new Date())
      // Clear if input is invalid on blur if invalid dates are not allowed.
      if (!allowInvalidDates && !isValid(startDate)) {
        setStartInputDisplay('')
      }
      if (!allowInvalidDates && !isValid(endDate)) {
        setEndInputDisplay('')
      }
      handleUpdateInputs([startDate, endDate])
    },
    [
      startInputDisplay,
      dateFormat,
      endInputDisplay,
      allowInvalidDates,
      handleUpdateInputs,
    ],
  )

  const handleInputClick: MouseEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      e.stopPropagation()
      if (!allowManualInput) {
        disclosureProps.onOpen()
      }
      onClick?.(e)
    },
    [allowManualInput, disclosureProps, onClick],
  )

  const calendarButtonAria = useMemo(() => {
    let ariaLabel = 'Select from date picker. '
    if (!startDate && !endDate) return ariaLabel + 'No date range selected.'
    if (startDate && !endDate) {
      if (isValid(startDate)) {
        ariaLabel += `Selected date is ${startDate.toDateString()}.`
      } else {
        ariaLabel += 'Selected start date is invalid.'
      }
      // Both date range exists
    } else {
      ariaLabel += `Selected date range is ${startDate?.toDateString()} to ${endDate?.toDateString()}.`
    }
    return ariaLabel
  }, [endDate, startDate])

  const handleStartDateChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    const date = parse(event.target.value, dateFormat, new Date())
    setStartInputDisplay(event.target.value)
    let clonedValue = [...internalValue] as DateRangeValue

    if (!isValid(date)) {
      if (clonedValue.length > 0) {
        clonedValue = [null, null]
      }
    } else {
      clonedValue[0] = date
    }

    setInternalValue(clonedValue)
  }

  const handleEndDateChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const date = parse(event.target.value, dateFormat, new Date())
    setEndInputDisplay(event.target.value)
    const [startDate, endDate] = internalValue
    let clonedValue = [...internalValue] as DateRangeValue

    if (!isValid(date)) {
      if (startDate && endDate) {
        clonedValue = [startDate, null]
      }
    } else {
      clonedValue[1] = date
    }

    setInternalValue(clonedValue)
  }

  const handleCalendarDateChange = useCallback(
    (date: DateRangeValue) => {
      const zonedDateRange = date.map((d) =>
        d ? zonedTimeToUtc(d, timeZone) : null,
      ) as DateRangeValue
      const [nextStartDate, nextEndDate] = zonedDateRange
      setInternalValue(zonedDateRange)
      setStartInputDisplay(
        nextStartDate ? format(nextStartDate, displayFormat, { locale }) : '',
      )

      setEndInputDisplay(
        nextEndDate ? format(nextEndDate, displayFormat, { locale }) : '',
      )
      if (nextStartDate && nextEndDate && closeCalendarOnChange) {
        disclosureProps.onClose()
      }
    },
    [
      closeCalendarOnChange,
      disclosureProps,
      displayFormat,
      locale,
      setInternalValue,
      timeZone,
    ],
  )

  const handleFieldContainerClick = useCallback(() => {
    if (allowManualInput) {
      startInputRef.current?.focus()
    } else {
      disclosureProps.onOpen()
    }
  }, [allowManualInput, disclosureProps])

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
    handleCalendarDateChange,
    handleFieldContainerClick,
    handleStartDateChange,
    handleEndDateChange,
    handleInputClick,
    calendarButtonAria,
    startInputRef,
    endInputRef,
    initialFocusRef,
    handleInputBlur,
    fcProps,
    internalValue,
    startInputDisplay,
    endInputDisplay,
    closeCalendarOnChange,
    placeholder,
    allowManualInput,
    colorScheme,
    isDateUnavailable,
    disclosureProps,
    labelSeparator,
    monthsToDisplay,
  }
}
