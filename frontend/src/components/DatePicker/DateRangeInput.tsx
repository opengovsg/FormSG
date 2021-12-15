import { useCallback, useRef, useState } from 'react'
import {
  Flex,
  forwardRef,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Text,
} from '@chakra-ui/react'

import { BxCalendar } from '~assets/icons'
import IconButton from '~components/IconButton'

import Input, { InputProps } from '../Input'

import { DateRangePicker } from './DateRangePicker'

export interface DateRangeInputProps
  extends Omit<InputProps, 'value' | 'onChange'> {
  name: string
  value?: string
  onChange?: (val: string) => void
}

export const DateRangeInput = forwardRef<DateRangeInputProps, 'input'>(
  ({ onChange, value = '', ...props }, ref) => {
    const initialFocusRef = useRef<HTMLInputElement>(null)

    const [selectedDates, setSelectedDates] = useState<Date[]>([])
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null)

    const handleOnDateSelected = (date: Date) => {
      const newDates = [...selectedDates]
      if (selectedDates.length) {
        if (selectedDates.length === 1) {
          const firstTime = selectedDates[0]
          if (firstTime < date) {
            newDates.push(date)
          } else {
            newDates.unshift(date)
          }
          setSelectedDates(newDates)
        } else if (newDates.length === 2) {
          setSelectedDates([date])
        }
      } else {
        newDates.push(date)
        setSelectedDates(newDates)
      }
    }

    const isDateInRange = useCallback(
      (date: Date) => {
        if (!selectedDates?.length) {
          return false
        }
        const firstSelected = selectedDates[0]
        if (selectedDates.length === 2) {
          const secondSelected = selectedDates[1]
          return firstSelected < date && secondSelected > date
        } else {
          return (
            hoveredDate &&
            ((firstSelected < date && hoveredDate >= date) ||
              (date < firstSelected && date >= hoveredDate))
          )
        }
      },
      [hoveredDate, selectedDates],
    )

    const onMouseEnterHighlight = useCallback(
      (date: Date) => {
        if (!selectedDates?.length) {
          return
        }
        setHoveredDate(date)
      },
      [selectedDates?.length],
    )

    const onMouseLeaveCalendar = useCallback(() => {
      setHoveredDate(null)
    }, [])

    return (
      <Flex>
        <Input
          type="date"
          sx={{
            borderRadius: '4px 0 0 4px',
            // Chrome displays a default calendar icon, which we want to hide
            // so all browsers display our icon consistently.
            '::-webkit-calendar-picker-indicator': {
              display: 'none',
            },
          }}
          onChange={(e) => onChange?.(e.target.value)}
          ref={ref}
          value={value}
          {...props}
        />
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
                        Select a date
                      </Text>
                      <PopoverCloseButton position="static" />
                    </Flex>
                  </PopoverHeader>
                  <PopoverBody p={0}>
                    <DateRangePicker
                      selectedDates={selectedDates}
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
      </Flex>
    )
  },
)
