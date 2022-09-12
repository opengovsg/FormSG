import React, {
  ChangeEventHandler,
  FocusEventHandler,
  Fragment,
  useCallback,
  useEffect,
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
}

export const DateRangePicker = forwardRef<DateRangePickerProps, 'input'>(
  (
    {
      value,
      defaultValue = [null, null],
      onChange,
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

    useEffect(() => {
      if (startDate) {
        if (isValid(startDate)) {
          setStartInputDisplay(format(startDate, displayFormat, { locale }))
        } else {
          setStartInputDisplay('')
        }
      } else {
        setStartInputDisplay('')
      }
      if (endDate) {
        if (isValid(endDate)) {
          setEndInputDisplay(format(endDate, displayFormat, { locale }))
        } else {
          setEndInputDisplay('')
        }
      } else {
        setEndInputDisplay('')
      }
    }, [startDate, displayFormat, locale, endDate])

    const fcProps = useFormControlProps({
      isInvalid: isInvalidProp,
      isDisabled: isDisabledProp,
      isReadOnly: isReadOnlyProp,
      isRequired: isRequiredProp,
      ...props,
    })

    const handleInputBlur: FocusEventHandler<HTMLInputElement> = useCallback(
      (e) => {
        // TODO: handle invalid dates
        const startDate = parse(startInputDisplay, dateFormat, new Date())
        const endDate = parse(endInputDisplay, dateFormat, new Date())
        // Clear if input is invalid on blur if invalid dates are not allowed.
        if (!allowInvalidDates && !isValid(startDate)) {
          // setInternalValue(null)
          setStartInputDisplay('')
        }
        onBlur?.(e)
      },
      [
        startInputDisplay,
        dateFormat,
        endInputDisplay,
        allowInvalidDates,
        onBlur,
      ],
    )

    const initialFocusRef = useRef<HTMLInputElement>(null)
    const startInputRef = useRef<HTMLInputElement>(null)
    const mergedStartInputRef = useMergeRefs(startInputRef, ref)

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
                        isReadOnly={fcProps.isReadOnly || !allowManualInput}
                      />
                      <Text color="secondary.400">to</Text>
                      <Input
                        variant="unstyled"
                        sx={styles.field}
                        as={InputMask}
                        mask="99/99/9999"
                        value={endInputDisplay}
                        onChange={handleEndDateChange}
                        placeholder={displayFormat.toLowerCase()}
                        maskPlaceholder={displayFormat.toLowerCase()}
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
                  <ReactFocusLock returnFocus>
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
                        onChange={setInternalValue}
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
