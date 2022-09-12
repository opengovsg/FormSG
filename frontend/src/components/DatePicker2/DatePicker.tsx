import { useEffect, useMemo, useRef, useState } from 'react'
import ReactFocusLock from 'react-focus-lock'
import {
  Box,
  Flex,
  forwardRef,
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  useControllableState,
} from '@chakra-ui/react'
import { format, isDate, isValid } from 'date-fns'

import { BxCalendar } from '~assets/icons'
import { ThemeColorScheme } from '~theme/foundations/colours'
import DateInput from '~components/DatePicker'
import IconButton from '~components/IconButton'
import Input, { InputProps } from '~components/Input'

export interface DatePickerProps extends Pick<InputProps, 'name'> {
  /**
   * The current selected date.
   * If provided, the input will be a controlled input, and `onChange` must be provided.
   */
  value?: Date | null
  /**
   * Callback fired when the date changes.
   * If `value` is provided, this must be provided.
   * @param {Date | null} date The new selected date.
   */
  onChange?: (date: Date | null) => void
  /** The default selected date, used if input is uncontrolled */
  defaultValue?: Date | null
  /** The `date-fns` format to display the date. Defaults to `dd/MM/yyyy` */
  displayFormat?: string
  /** The `date-fns` format to parse manual string input. Defaults to `dd/MM/yyyy` */
  dateFormat?: (input: string) => Date
  /** Whether the input allows manual date entry. */
  allowManualInput?: boolean
  /** Locale of the date to be applied if provided. */
  locale?: Locale
  /** Function to determine whether a date should be made unavailable. */
  isDateUnavailable?: (d: Date) => boolean
  /** Color scheme for date picker component */
  colorScheme?: ThemeColorScheme
}

export const DatePicker = forwardRef<DatePickerProps, 'input'>(
  (
    {
      value = new Date(),
      defaultValue,
      onChange,
      displayFormat = 'dd/MM/yyyy',
      locale,
      isDateUnavailable,
      colorScheme,
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useControllableState({
      defaultValue,
      value,
      onChange,
    })

    const [inputDisplay, setInputDisplay] = useState(
      internalValue instanceof Date
        ? format(internalValue, displayFormat, { locale })
        : '',
    )

    const inputRef = useRef<HTMLInputElement>(null)
    const initialFocusRef = useRef<HTMLInputElement>(null)

    const calendarButtonAria = useMemo(() => {
      let ariaLabel = 'Choose date. '
      if (internalValue) {
        if (isValid(internalValue)) {
          ariaLabel += `Selected date is ${internalValue.toLocaleDateString()}.`
        } else {
          ariaLabel += 'The current selected date is invalid.'
        }
      }
      return ariaLabel
    }, [internalValue])

    const handleDateChange = (onClose: () => void) => (date: Date) => {
      setInternalValue(date)
      setInputDisplay(format(date, displayFormat, { locale }))
      onClose()
    }

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
                <Input value={inputDisplay} />
              </PopoverAnchor>
              <PopoverTrigger>
                <IconButton
                  colorScheme={colorScheme}
                  aria-label={calendarButtonAria}
                  icon={<BxCalendar />}
                  variant="inputAttached"
                  borderRadius={0}
                  isActive={isOpen}
                  // isDisabled={fcProps.isDisabled || fcProps.isReadOnly}
                />
              </PopoverTrigger>
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
                    <DateInput.DatePicker
                      colorScheme={colorScheme}
                      date={internalValue ?? undefined}
                      isDateUnavailable={isDateUnavailable}
                      onSelectDate={handleDateChange(onClose)}
                      ref={initialFocusRef}
                    />
                  </PopoverBody>
                </ReactFocusLock>
              </PopoverContent>
            </>
          )}
        </Popover>
      </Flex>
    )
  },
)
