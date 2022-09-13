import { Fragment, useMemo } from 'react'
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
  Text,
  useMergeRefs,
} from '@chakra-ui/react'

import { BxCalendar } from '~assets/icons'
import { Calendar, CalendarProps } from '~components/Calendar'
import IconButton from '~components/IconButton'
import Input, { InputProps } from '~components/Input'

import { useDatePicker } from './useDatePicker'

export interface DatePickerProps
  extends CalendarProps,
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

  /**
   * Value to display in input, derived from the selected date.
   * If provided, input will be controlled, and empty string denotes no date selection.
   */
  inputValue?: string
  /** If provided, callback will be fired when the controlled input value changes. */
  onInputValueChange?: (value: string) => void
  /** Default value for uncontrolled input. */
  defaultInputValue?: string
}

export const DatePicker = forwardRef<DatePickerProps, 'input'>((props, ref) => {
  const {
    initialFocusRef,
    inputRef,
    styles,
    handleInputChange,
    handleInputBlur,
    handleDateChange,
    internalValue,
    internalInputValue,
    calendarButtonAria,
    fcProps,
    closeCalendarOnChange,
    displayFormat,
    allowManualInput,
    colorScheme,
    isDateUnavailable,
  } = useDatePicker(props)
  const mergedInputRef = useMergeRefs(inputRef, ref)

  const InputTriggerOrFragment = useMemo(() => {
    return allowManualInput ? Fragment : PopoverTrigger
  }, [allowManualInput])

  return (
    <Flex>
      <Popover
        placement="bottom-start"
        isLazy
        initialFocusRef={initialFocusRef}
        closeOnBlur={closeCalendarOnChange}
        returnFocusOnClose={false}
      >
        {({ isOpen, onClose }) => (
          <>
            <PopoverAnchor>
              <Flex sx={styles.fieldwrapper}>
                <InputTriggerOrFragment>
                  <Input
                    variant="unstyled"
                    sx={styles.field}
                    as={InputMask}
                    mask="99/99/9999"
                    value={internalInputValue}
                    onChange={handleInputChange}
                    placeholder={displayFormat.toLowerCase()}
                    maskPlaceholder={displayFormat.toLowerCase()}
                    ref={mergedInputRef}
                    {...fcProps}
                    borderRightRadius={0}
                    onBlur={handleInputBlur}
                    isReadOnly={fcProps.isReadOnly || !allowManualInput}
                  />
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
                    <Calendar
                      colorScheme={colorScheme}
                      value={internalValue ?? undefined}
                      isDateUnavailable={isDateUnavailable}
                      onChange={handleDateChange(onClose)}
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
})
