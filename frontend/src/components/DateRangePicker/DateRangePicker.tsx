import {
  ChangeEventHandler,
  FocusEventHandler,
  Fragment,
  MouseEventHandler,
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
  useDisclosure,
  useFormControlProps,
  useMergeRefs,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { format, isValid, parse } from 'date-fns'

import { BxCalendar } from '~assets/icons'
import { RangeCalendar, RangeCalendarProps } from '~components/Calendar'
import { DateRangeValue } from '~components/Calendar/CalendarBase/CalendarContext'
import { DatePickerBaseProps } from '~components/DatePicker2'
import IconButton from '~components/IconButton'
import Input from '~components/Input'

export interface DateRangePickerProps
  extends DatePickerBaseProps,
    RangeCalendarProps {
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
    const { isOpen, onOpen, onClose } = useDisclosure()
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

    const handleInputClick: MouseEventHandler = useCallback(
      (e) => {
        e.stopPropagation()
        if (!allowManualInput) {
          onOpen()
        }
      },
      [allowManualInput, onOpen],
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
      (date: DateRangeValue) => {
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
      [closeCalendarOnChange, displayFormat, locale, onClose, setInternalValue],
    )

    const handleFieldContainerClick = useCallback(() => {
      if (allowManualInput) {
        startInputRef.current?.focus()
      }
    }, [allowManualInput])

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
          isOpen={isOpen}
          onClose={onClose}
          onOpen={onOpen}
          isLazy
          initialFocusRef={initialFocusRef}
          closeOnBlur={closeCalendarOnChange}
          returnFocusOnClose={false}
        >
          <PopoverAnchor>
            <Flex
              sx={styles.fieldwrapper}
              onClick={handleFieldContainerClick}
              overflowX="hidden"
            >
              <Flex
                overflowX="auto"
                sx={{
                  // Hide scrollbars so dual inputs feel like a real normal input.
                  '-ms-overflow-style': 'none',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': {
                    display: 'none',
                  },
                }}
              >
                <InputTriggerOrFragment>
                  <Stack direction="row" align="center">
                    <Input
                      variant="unstyled"
                      aria-label="Start date of range"
                      sx={styles.field}
                      width="6rem"
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
                      onClick={handleInputClick}
                      isReadOnly={fcProps.isReadOnly || !allowManualInput}
                    />
                    <Text color="secondary.400">{labelSeparator}</Text>
                    <Input
                      variant="unstyled"
                      aria-label="Start date of range"
                      sx={styles.field}
                      width="6rem"
                      as={InputMask}
                      mask="99/99/9999"
                      value={endInputDisplay}
                      onChange={handleEndDateChange}
                      placeholder={displayFormat.toLowerCase()}
                      maskPlaceholder={displayFormat.toLowerCase()}
                      onClick={handleInputClick}
                      ref={endInputRef}
                      {...fcProps}
                      borderRightRadius={0}
                      onBlur={handleInputBlur}
                      isReadOnly={fcProps.isReadOnly || !allowManualInput}
                    />
                  </Stack>
                </InputTriggerOrFragment>
              </Flex>
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
                    onChange={handleCalendarDateChange}
                    ref={initialFocusRef}
                  />
                </PopoverBody>
              </ReactFocusLock>
            </PopoverContent>
          </Portal>
        </Popover>
      </Flex>
    )
  },
)
