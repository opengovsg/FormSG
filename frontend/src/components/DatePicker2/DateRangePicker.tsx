import React, {
  ChangeEventHandler,
  FocusEventHandler,
  Fragment,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import ReactFocusLock from 'react-focus-lock'
import InputMask from 'react-input-mask'
import {
  Flex,
  forwardRef,
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Stack,
  Text,
  useControllableState,
  useFormControlProps,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { format, isValid, parse } from 'date-fns'

import { BxCalendar } from '~assets/icons'
import { RangeCalendar, RangeCalendarProps } from '~components/Calendar'
import { DateRangeValue } from '~components/Calendar/CalendarBase/CalendarContext'
import IconButton from '~components/IconButton'
import Input, { InputProps } from '~components/Input'

export interface DateRangePickerProps
  extends RangeCalendarProps,
    Omit<InputProps, 'value' | 'defaultValue' | 'onChange' | 'colorScheme'> {
  /**
   * The `date-fns` format to display the date.
   * @defaultValue `dd/MM/yyyy`
   */
  displayFormat?: string
  /**
   * The `date-fns` format to parse manual string input.
   * @defaultValue `dd/MM/yyyy`
   */
  dateFormat?: string
  /** Whether the input allows manual date entry. */
  allowManualInput?: boolean
  /** If `true`, will allow invalid dates to be set for external validation.
   * @defaultValue `true`
   */
  allowInvalidDates?: boolean
  /** Whether the calendar will close once a date is selected. Defaults to `true` */
  closeCalendarOnChange?: boolean
  /** Locale of the date to be applied if provided. */
  locale?: Locale

  /**
   * Separator between dates
   * @defaultValue `"to"`
   */
  labelSeparator?: string
}

export const DateRangePicker = forwardRef<DateRangePickerProps, 'input'>(
  (
    {
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
      locale,
      isDateUnavailable,
      allowManualInput = true,
      allowInvalidDates = true,
      closeCalendarOnChange = true,
      onBlur,
      onClick,
      colorScheme = 'primary',
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useControllableState({
      defaultValue,
      value,
      onChange,
    })
    const [startDate, endDate] = internalValue

    const [startInputDisplay, setStartInputDisplay] = useState(
      startDate && isValid(startDate)
        ? format(startDate, displayFormat, { locale })
        : '',
    )
    const [endInputDisplay, setEndInputDisplay] = useState(
      endDate && isValid(endDate)
        ? format(endDate, displayFormat, { locale })
        : '',
    )

    const handleUpdateInputs = useCallback(
      (nextRange: DateRangeValue) => {
        // Replace invalid dates with null
        const sortedRange = nextRange.sort((a, b) =>
          a && b ? a.getTime() - b.getTime() : 0,
        )

        // Replace invalid dates with null
        const validRange = sortedRange.map((date) =>
          isValid(date) ? date : null,
        ) as DateRangeValue

        const [nextStart, nextEnd] = sortedRange
        if (nextStart) {
          if (isValid(nextStart)) {
            setStartInputDisplay(format(nextStart, displayFormat, { locale }))
          } else if (!allowInvalidDates) {
            setStartInputDisplay('')
          }
        } else {
          setStartInputDisplay('')
        }
        if (nextEnd) {
          if (isValid(nextEnd)) {
            setEndInputDisplay(format(nextEnd, displayFormat, { locale }))
          } else if (!allowInvalidDates) {
            setEndInputDisplay('')
          }
        } else {
          setEndInputDisplay('')
        }
        setInternalValue(validRange)
      },
      [allowInvalidDates, displayFormat, locale, setInternalValue],
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

    const initialFocusRef = useRef<HTMLInputElement>(null)
    const startInputRef = useRef<HTMLInputElement>(null)
    const mergedStartInputRef = useMergeRefs(startInputRef, ref)
    const endInputRef = useRef<HTMLInputElement>(null)

    const calendarButtonAria = useMemo(() => {
      let ariaLabel = 'Choose date. '
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

    const handleEndDateChange: ChangeEventHandler<HTMLInputElement> = (
      event,
    ) => {
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
      (onClose: () => void) => (date: DateRangeValue) => {
        setInternalValue(date)
        const [nextStartDate, nextEndDate] = date
        setStartInputDisplay(
          nextStartDate ? format(nextStartDate, displayFormat, { locale }) : '',
        )

        setEndInputDisplay(
          nextEndDate ? format(nextEndDate, displayFormat, { locale }) : '',
        )
        if (nextStartDate && nextEndDate && closeCalendarOnChange) {
          onClose()
          // Refocus input after closing calendar.
          setTimeout(() => endInputRef.current?.focus(), 0)
        }
      },
      [closeCalendarOnChange, displayFormat, locale, setInternalValue],
    )

    const handleFieldContainerClick = useCallback(() => {
      startInputRef.current?.focus()
    }, [])

    const InputTriggerOrFragment = useMemo(() => {
      return allowManualInput ? Fragment : PopoverTrigger
    }, [allowManualInput])

    const styles = useMultiStyleConfig('DateInput', {
      colorScheme,
    })

    return (
      <Flex>
        <Popover
          placement="bottom-start"
          isLazy
          initialFocusRef={initialFocusRef}
          closeOnBlur={closeCalendarOnChange}
          returnFocusOnClose={false}
        >
          {({ isOpen, onClose }) => (
            <>
              <PopoverAnchor>
                <Flex
                  sx={styles.fieldwrapper}
                  onClick={handleFieldContainerClick}
                >
                  <InputTriggerOrFragment>
                    <Stack direction="row" align="center">
                      <Input
                        variant="unstyled"
                        sx={styles.field}
                        as={InputMask}
                        mask="99/99/9999"
                        value={startInputDisplay}
                        onChange={handleStartDateChange}
                        placeholder={displayFormat.toLowerCase()}
                        maskPlaceholder={displayFormat.toLowerCase()}
                        ref={mergedStartInputRef}
                        {...fcProps}
                        borderRightRadius={0}
                        onBlur={handleInputBlur}
                        onClick={(e) => e.stopPropagation()}
                        isReadOnly={fcProps.isReadOnly || !allowManualInput}
                      />
                      <Text color="secondary.400">{labelSeparator}</Text>
                      <Input
                        variant="unstyled"
                        sx={styles.field}
                        as={InputMask}
                        mask="99/99/9999"
                        value={endInputDisplay}
                        onChange={handleEndDateChange}
                        placeholder={displayFormat.toLowerCase()}
                        maskPlaceholder={displayFormat.toLowerCase()}
                        onClick={(e) => e.stopPropagation()}
                        ref={endInputRef}
                        {...fcProps}
                        borderRightRadius={0}
                        onBlur={handleInputBlur}
                        isReadOnly={fcProps.isReadOnly || !allowManualInput}
                      />
                    </Stack>
                  </InputTriggerOrFragment>
                </Flex>
              </PopoverAnchor>
              <PopoverTrigger>
                <IconButton
                  colorScheme={colorScheme}
                  aria-label={calendarButtonAria}
                  icon={<BxCalendar />}
                  variant="inputAttached"
                  borderRadius={0}
                  isActive={isOpen}
                  isDisabled={fcProps.isDisabled || fcProps.isReadOnly}
                />
              </PopoverTrigger>
              <Portal>
                <PopoverContent
                  borderRadius="4px"
                  w="unset"
                  maxW="100vw"
                  bg="white"
                >
                  <ReactFocusLock>
                    <PopoverHeader p={0}>
                      <Flex
                        h="3.5rem"
                        mx={{ base: '1rem', md: '1.5rem' }}
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text textStyle="subhead-2" color="secondary.500">
                          Select a date
                        </Text>
                        <PopoverCloseButton
                          position="static"
                          variant="clear"
                          colorScheme="secondary"
                        />
                      </Flex>
                    </PopoverHeader>
                    <PopoverBody p={0}>
                      <RangeCalendar
                        colorScheme={colorScheme}
                        value={internalValue ?? undefined}
                        isDateUnavailable={isDateUnavailable}
                        onChange={handleCalendarDateChange(onClose)}
                        ref={initialFocusRef}
                      />
                    </PopoverBody>
                  </ReactFocusLock>
                </PopoverContent>
              </Portal>
            </>
          )}
        </Popover>
      </Flex>
    )
  },
)
