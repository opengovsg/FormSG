/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ChangeEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Box,
  CSSObject,
  Flex,
  forwardRef,
  HStack,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Text,
  useMultiStyleConfig,
  Wrap,
} from '@chakra-ui/react'
import { compareAsc, format } from 'date-fns'

import { BxCalendar } from '~assets/icons'
import IconButton from '~components/IconButton'
import Input, { InputProps } from '~components/Input'

import { DateRangePicker } from './DateRangePicker'

export interface DateRangeInputProps extends InputProps {
  value?: Date[]
  onChange?: (val: Date[]) => void
}

export const DateRangeInput = forwardRef<DateRangeInputProps, 'input'>(
  ({ onChange, value = [], ...props }, ref) => {
    const initialFocusRef = useRef<HTMLInputElement>(null)

    const [hoveredDate, setHoveredDate] = useState<Date | null>(null)

    /**
     * Handles date selection in calendar panel.
     * Calls onChange prop (if provided) with sorted dates.
     * @param date the new date selected
     */
    const handleOnDateSelected = useCallback(
      (date: Date) => {
        let newDates = value.slice()
        if (value.length) {
          if (value.length === 1) {
            const firstTime = value[0]
            if (firstTime < date) {
              newDates.push(date)
            } else {
              newDates.unshift(date)
            }
          } else if (newDates.length === 2) {
            newDates = [date]
          }
        } else {
          newDates.push(date)
        }
        onChange?.(newDates.sort(compareAsc))
      },
      [onChange, value],
    )

    const isDateInRange = useCallback(
      (date: Date) => {
        if (!value?.length) {
          return false
        }
        const firstSelected = value[0]
        if (value.length === 2) {
          const secondSelected = value[1]
          return firstSelected < date && secondSelected > date
        } else {
          return (
            hoveredDate &&
            ((firstSelected < date && hoveredDate >= date) ||
              (date < firstSelected && date >= hoveredDate))
          )
        }
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
      setHoveredDate(null)
    }, [])

    const handleStartDateChange: ChangeEventHandler<HTMLInputElement> = (e) => {
      const dateFromValue = new Date(e.target.value)
      let clonedValue = value.slice()

      if (isNaN(dateFromValue.getTime())) {
        if (clonedValue.length > 0) {
          clonedValue = []
        }
      } else {
        clonedValue[0] = dateFromValue
      }

      onChange?.(clonedValue)
    }

    const startDateRenderedValue = useMemo(() => {
      return value[0] ? format(value[0], 'yyyy-MM-dd') ?? '' : ''
    }, [value])

    const handleEndDateChange: ChangeEventHandler<HTMLInputElement> = (e) => {
      const dateFromValue = new Date(e.target.value)
      const clonedValue = value.slice()
      if (isNaN(dateFromValue.getTime())) {
        if (clonedValue.length === 2) {
          clonedValue.pop()
        }
      } else {
        clonedValue[1] = dateFromValue
      }

      onChange?.(clonedValue)
    }

    const endDateRenderedValue = useMemo(() => {
      return value[1] ? format(value[1], 'yyyy-MM-dd') ?? '' : ''
    }, [value])

    return (
      <Wrap shouldWrapChildren spacing="0.25rem">
        <Wrap shouldWrapChildren spacing="0.5rem" align="center">
          <Input
            aria-label="Start date"
            id={`${props.name}-start-date`}
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
        <Popover
          placement="bottom-end"
          initialFocusRef={initialFocusRef}
          isLazy
        >
          {({ isOpen }) => (
            <>
              <PopoverTrigger>
                <IconButton
                  aria-label="Open calendar"
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
                <PopoverContent borderRadius="4px" w="unset" maxW="100vw">
                  <PopoverHeader py="1rem" px="1.5rem">
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text textStyle="subhead-2" color="secondary.500">
                        Select date range
                      </Text>
                      <PopoverCloseButton position="static" />
                    </Flex>
                  </PopoverHeader>
                  <PopoverBody p={0}>
                    <DateRangePicker
                      selectedDates={value}
                      hoveredDate={hoveredDate}
                      isDateInRange={isDateInRange}
                      onMouseEnterHighlight={onMouseEnterHighlight}
                      onMouseLeaveCalendar={onMouseLeaveCalendar}
                      onSelectDate={handleOnDateSelected}
                      ref={initialFocusRef}
                    />
                  </PopoverBody>
                </PopoverContent>
              </Portal>
            </>
          )}
        </Popover>
      </Wrap>
    )
  },
)
