import { KeyboardEventHandler, useCallback, useMemo, useRef } from 'react'
import FocusLock from 'react-focus-lock'
import {
  Flex,
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  useFormControlProps,
} from '@chakra-ui/react'
import { ComponentWithAs, forwardRef } from '@chakra-ui/system'
import { format } from 'date-fns'

import { BxCalendar } from '~assets/icons'
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
  (
    {
      onChange,
      value = '',
      isDateUnavailable,
      isDisabled: isDisabledProp,
      ...props
    },
    ref,
  ) => {
    const { isDisabled } = useFormControlProps({ isDisabled: isDisabledProp })

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

    const calendarButtonAria = useMemo(() => {
      let ariaLabel = 'Choose date. '
      if (value.length === 1) {
        ariaLabel += `Selected date is ${new Date(value[0]).toDateString()}.`
      }
      return ariaLabel
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
        <Popover
          placement="bottom-start"
          initialFocusRef={initialFocusRef}
          isLazy
        >
          {({ isOpen }) => (
            <>
              <PopoverAnchor>
                <Input
                  zIndex={1}
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
                  isDisabled={isDisabled}
                  {...props}
                />
              </PopoverAnchor>
              <PopoverTrigger>
                <IconButton
                  aria-label={calendarButtonAria}
                  icon={<BxCalendar />}
                  variant="inputAttached"
                  borderRadius={0}
                  isActive={isOpen}
                  isDisabled={isDisabled}
                />
              </PopoverTrigger>
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
                </FocusLock>
              </PopoverContent>
            </>
          )}
        </Popover>
      </Flex>
    )
  },
) as DateInputWithSubcomponents

DateInput.DatePicker = DatePicker
