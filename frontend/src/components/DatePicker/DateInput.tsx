import { useCallback, useRef } from 'react'
import {
  Flex,
  IconButton,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
} from '@chakra-ui/react'
import { ComponentWithAs, forwardRef } from '@chakra-ui/system'
import { css } from '@emotion/react'
import { format } from 'date-fns'

import { BxCalendar } from '~assets/icons'

import Input, { InputProps } from '../Input'

import { DatePicker } from './DatePicker'

export interface DateInputProps extends InputProps {
  name: string
}

type DateInputWithSubcomponents = ComponentWithAs<'input', DateInputProps> & {
  DatePicker: typeof DatePicker
}

export const DateInput = forwardRef<DateInputProps, 'input'>(
  ({ onChange, ...props }, ref) => {
    const initialFocusRef = useRef<HTMLInputElement>(null)
    const handleDatepickerSelection = useCallback(
      (d: Date) => {
        console.log('invoking onChange with', format(d, 'yyyy-MM-dd'))
        onChange?.({
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          target: { value: format(d, 'yyyy-MM-dd'), name: props.name },
        })
      },
      [onChange, props.name],
    )
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
          onChange={onChange}
          {...props}
        />
        <Popover
          placement="bottom-end"
          initialFocusRef={initialFocusRef}
          isLazy
        >
          <PopoverTrigger>
            {/* Internal IconButton doesn't position popover correctly, so
              use Chakra's directly */}
            <IconButton
              aria-label="Open calendar"
              icon={<BxCalendar />}
              fontSize="1.25rem"
              variant="outline"
              color="secondary.500"
              borderColor="neutral.400"
              borderRadius="0"
              // Avoid double border with input
              ml="-1px"
            />
          </PopoverTrigger>
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
                onDateSelected={handleDatepickerSelection}
                ref={initialFocusRef}
              />
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Flex>
    )
  },
) as DateInputWithSubcomponents

DateInput.DatePicker = DatePicker
