import { useCallback, useMemo, useRef } from 'react'
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
import { css } from '@emotion/react'
import { format } from 'date-fns'

import { BxCalendar } from '~assets/icons'
import IconButton from '~components/IconButton'

import Input, { InputProps } from '../Input'

import { DatePicker } from './DatePicker'

export interface DateInputProps extends Omit<InputProps, 'value' | 'onChange'> {
  name: string
  value?: string
  onChange?: (val: string) => void
}

type DateInputWithSubcomponents = ComponentWithAs<'input', DateInputProps> & {
  DatePicker: typeof DatePicker
}

export const DateInput = forwardRef<DateInputProps, 'input'>(
  ({ onChange, value = '', ...props }, ref) => {
    const initialFocusRef = useRef<HTMLInputElement>(null)

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

    return (
      <Flex>
        <Input
          type="date"
          // Chrome displays a default calendar icon, which we want to hide
          // so all browsers display our icon consistently.
          css={css`
            ::-webkit-calendar-picker-indicator {
              display: none;
            }
          `}
          sx={{
            borderRadius: '4px 0 0 4px',
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
                  <PopoverBody>
                    <DateInput.DatePicker
                      date={datePickerDate}
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
