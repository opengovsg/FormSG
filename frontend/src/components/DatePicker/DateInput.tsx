import { KeyboardEventHandler, useCallback, useMemo, useRef } from 'react'
import {
  Flex,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Text,
} from '@chakra-ui/react'
import { ComponentWithAs, forwardRef } from '@chakra-ui/system'
import { format } from 'date-fns'

import { BxCalendar } from '~assets/icons'
import { useIsMobile } from '~hooks/useIsMobile'
import IconButton from '~components/IconButton'

import Input, { InputProps } from '../Input'

import { DatePicker, DatePickerProps } from './DatePicker'

export interface DateInputProps
  extends Omit<InputProps, 'value' | 'onChange'>,
    Pick<DatePickerProps, 'isDateUnavailable'> {
  name: string
  value?: string
  onChange?: (val: string) => void
}

type DateInputWithSubcomponents = ComponentWithAs<'input', DateInputProps> & {
  DatePicker: typeof DatePicker
}

export const DateInput = forwardRef<DateInputProps, 'input'>(
  ({ onChange, value = '', isDateUnavailable, ...props }, ref) => {
    const initialFocusRef = useRef<HTMLInputElement>(null)

    const isMobile = useIsMobile()

    const handleDatepickerSelection = useCallback(
      (d: Date) => {
        onChange?.(format(d, 'yyyy-MM-dd'))
      },
      [onChange],
    )

    const datePickerDate = useMemo(() => {
      const dateFromValue = new Date(value)
      return isNaN(dateFromValue.getTime()) ? undefined : dateFromValue
    }, [value])

    /**
     * Disable spacebar from opening native calendar
     */
    const handlePreventOpenNativeCalendar: KeyboardEventHandler<HTMLInputElement> =
      useCallback((e) => {
        if (e.key === ' ') {
          e.preventDefault()
        }
      }, [])

    return (
      <Flex>
        <Input
          type="date"
          onKeyDown={handlePreventOpenNativeCalendar}
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
          // Prevent mobile taps to close popover when doing something like
          // changing months in the selector.
          closeOnBlur={!isMobile}
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
                <PopoverContent
                  borderRadius="4px"
                  w="unset"
                  maxW="100vw"
                  bg="white"
                >
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
                    <DateInput.DatePicker
                      date={datePickerDate}
                      isDateUnavailable={isDateUnavailable}
                      onSelectDate={handleDatepickerSelection}
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
) as DateInputWithSubcomponents

DateInput.DatePicker = DatePicker
