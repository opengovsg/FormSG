import {
  ChangeEventHandler,
  KeyboardEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import FocusLock from 'react-focus-lock'
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
  Text,
  Wrap,
} from '@chakra-ui/react'
import { compareAsc } from 'date-fns'

import { DateString } from '~shared/types'

import { BxCalendar } from '~assets/icons'
import IconButton from '~components/IconButton'
import Input, { InputProps } from '~components/Input'

import { DateRangePicker } from './DateRangePicker'
import { convertToDateString } from './utils'

export interface DateRangeInputProps
  extends Omit<InputProps, 'value' | 'onChange'> {
  value?: DateString[]
  onChange?: (val: DateString[]) => void
}

export const DateRangeInput = forwardRef<DateRangeInputProps, 'input'>(
  ({ onChange, value = [], ...props }, ref) => {
    const initialFocusRef = useRef<HTMLInputElement>(null)

    const [hoveredDate, setHoveredDate] = useState<Date>()

    const datePickerDates = useMemo(
      () => value.map((v) => new Date(v)).filter((d) => !isNaN(d.getTime())),
      [value],
    )

    /**
     * Handles date selection in calendar panel.
     * Calls onChange prop (if provided) with sorted dates.
     * @param date the new date selected
     */
    const handleOnDateSelected = useCallback(
      (date: Date) => {
        const dateString = convertToDateString(date)

        let newDates = value.slice()
        if (value.length) {
          if (value.length === 1) {
            const firstTime = value[0]
            if (compareAsc(new Date(firstTime), date) === -1) {
              newDates.push(dateString)
            } else {
              newDates.unshift(dateString)
            }
          } else if (newDates.length === 2) {
            newDates = [dateString]
          }
        } else {
          newDates.push(dateString)
        }
        onChange?.(newDates.sort())
      },
      [onChange, value],
    )

    const isDateInRange = useCallback(
      (date: Date) => {
        if (!value?.length) {
          return false
        }
        const dateString = convertToDateString(date)
        const firstSelected = value[0]
        if (value.length === 2) {
          const secondSelected = value[1]
          return firstSelected < dateString && secondSelected > dateString
        }

        if (!hoveredDate) {
          return false
        }
        const hoveredDateString = convertToDateString(hoveredDate)

        return (
          (firstSelected < dateString && hoveredDateString >= dateString) ||
          (dateString < firstSelected && dateString >= hoveredDateString)
        )
      },
      [hoveredDate, value],
    )

    const onMouseEnterHighlight = useCallback(
      (date: Date) => {
        if (!value?.length) {
          return
        }
        setHoveredDate(date)
      },
      [value?.length],
    )

    const onMouseLeaveCalendar = useCallback(() => {
      setHoveredDate(undefined)
    }, [])

    const handleStartDateChange: ChangeEventHandler<HTMLInputElement> = (e) => {
      const dateFromValue = new Date(e.target.value)
      let clonedValue = value.slice()

      if (isNaN(dateFromValue.getTime())) {
        if (clonedValue.length > 0) {
          clonedValue = []
        }
      } else {
        clonedValue[0] = convertToDateString(dateFromValue)
      }

      onChange?.(clonedValue)
    }

    /**
     * Disable spacebar from opening native calendar
     */
    const handlePreventOpenNativeCalendar: KeyboardEventHandler<HTMLInputElement> =
      useCallback((e) => {
        if (e.key === ' ') {
          e.preventDefault()
        }
      }, [])

    const startDateRenderedValue = useMemo(() => {
      return value[0] ?? ''
    }, [value])

    const handleEndDateChange: ChangeEventHandler<HTMLInputElement> = (e) => {
      const dateFromValue = new Date(e.target.value)
      const clonedValue = value.slice()
      if (isNaN(dateFromValue.getTime())) {
        if (clonedValue.length === 2) {
          clonedValue.pop()
        }
      } else {
        clonedValue[1] = convertToDateString(dateFromValue)
      }

      onChange?.(clonedValue)
    }

    const endDateRenderedValue = useMemo(() => {
      return value[1] ?? ''
    }, [value])

    const calendarButtonAria = useMemo(() => {
      let ariaLabel = 'Choose date. '
      if (value.length === 1) {
        ariaLabel += `Selected date is ${new Date(value[0]).toDateString()}.`
      } else if (value.length === 2) {
        ariaLabel += `Selected date range is ${new Date(
          value[0],
        ).toDateString()} to ${new Date(value[1]).toDateString()}.`
      }
      return ariaLabel
    }, [value])

    return (
      <Wrap shouldWrapChildren spacing="0.25rem">
        <Popover
          placement="bottom-start"
          initialFocusRef={initialFocusRef}
          isLazy
        >
          {({ isOpen }) => (
            <>
              <PopoverAnchor>
                <Wrap shouldWrapChildren spacing="0.5rem" align="center">
                  <Input
                    aria-label="Start date"
                    id={`${props.name}-start-date`}
                    onKeyDown={handlePreventOpenNativeCalendar}
                    type="date"
                    w="fit-content"
                    sx={{
                      // Chrome displays a default calendar icon, which we want to hide
                      // so all browsers display our icon consistently.
                      '::-webkit-calendar-picker-indicator': {
                        display: 'none',
                      },
                    }}
                    onChange={handleStartDateChange}
                    value={startDateRenderedValue}
                    ref={ref}
                    {...props}
                  />
                  <Text textStyle="body-1" color="secondary.400" px="0.5rem">
                    to
                  </Text>
                  <Input
                    aria-label="End date"
                    id={`${props.name}-end-date`}
                    onKeyDown={handlePreventOpenNativeCalendar}
                    type="date"
                    w="fit-content"
                    sx={{
                      // Chrome displays a default calendar icon, which we want to hide
                      // so all browsers display our icon consistently.
                      '::-webkit-calendar-picker-indicator': {
                        display: 'none',
                      },
                    }}
                    isDisabled={!startDateRenderedValue}
                    onChange={handleEndDateChange}
                    value={endDateRenderedValue}
                    {...props}
                  />
                </Wrap>
              </PopoverAnchor>
              <PopoverTrigger>
                <IconButton
                  aria-label={calendarButtonAria}
                  icon={<BxCalendar />}
                  isActive={isOpen}
                  fontSize="1.25rem"
                  variant="outline"
                  color="secondary.500"
                  borderColor="neutral.400"
                  borderRadius="0"
                  // Avoid double border with input
                  ml="-1px"
                />
              </PopoverTrigger>
              <Portal>
                <PopoverContent
                  borderRadius="4px"
                  w="unset"
                  maxW="100vw"
                  bg="white"
                >
                  <FocusLock returnFocus>
                    <PopoverHeader p={0}>
                      <Flex
                        h="3.5rem"
                        mx={{ base: '1rem', md: '1.5rem' }}
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text textStyle="subhead-2" color="secondary.500">
                          Select date range
                        </Text>
                        <PopoverCloseButton
                          variant="clear"
                          colorScheme="secondary"
                          position="static"
                        />
                      </Flex>
                    </PopoverHeader>
                    <PopoverBody p={0}>
                      <DateRangePicker
                        selectedDates={datePickerDates}
                        hoveredDate={hoveredDate}
                        isDateInRange={isDateInRange}
                        onMouseEnterHighlight={onMouseEnterHighlight}
                        onMouseLeaveCalendar={onMouseLeaveCalendar}
                        onSelectDate={handleOnDateSelected}
                        ref={initialFocusRef}
                      />
                    </PopoverBody>
                  </FocusLock>
                </PopoverContent>
              </Portal>
            </>
          )}
        </Popover>
      </Wrap>
    )
  },
)
