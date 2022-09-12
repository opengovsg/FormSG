import React, {
  FocusEventHandler,
  Fragment,
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
  Text,
  useControllableState,
  useFormControlProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { format, isValid, parse } from 'date-fns'

import { BxCalendar } from '~assets/icons'
import { Calendar, CalendarProps } from '~components/Calendar'
import IconButton from '~components/IconButton'
import Input, { InputProps } from '~components/Input'

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
}

export const DatePicker = forwardRef<DatePickerProps, 'input'>(
  (
    {
      value,
      defaultValue,
      onChange,
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
    const [internalValue, setInternalValue] = useControllableState({
      defaultValue,
      value,
      onChange,
    })

    const [inputDisplay, setInputDisplay] = useState(
      internalValue && isValid(internalValue)
        ? format(internalValue, displayFormat, { locale })
        : '',
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
        const date = parse(inputDisplay, dateFormat, new Date())
        // Clear if input is invalid on blur if invalid dates are not allowed.
        if (!allowInvalidDates && !isValid(date)) {
          setInternalValue(null)
          setInputDisplay('')
        }
        onBlur?.(e)
      },
      [allowInvalidDates, dateFormat, inputDisplay, onBlur, setInternalValue],
    )

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

    const handleDateChange = useCallback(
      (onClose: () => void) => (date: Date | null) => {
        if (allowInvalidDates || isValid(date) || !date) {
          setInternalValue(date)
        }
        if (date) {
          setInputDisplay(format(date, displayFormat, { locale }))
        } else {
          setInputDisplay('')
        }
        closeCalendarOnChange && onClose()
      },
      [
        allowInvalidDates,
        closeCalendarOnChange,
        displayFormat,
        locale,
        setInternalValue,
      ],
    )

    const handleInputChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const date = parse(event.target.value, dateFormat, new Date())
        setInputDisplay(event.target.value)
        if (isValid(date)) {
          setInternalValue(date)
        }
      },
      [dateFormat, setInternalValue],
    )

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
          isLazy
          initialFocusRef={initialFocusRef}
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
                      value={inputDisplay}
                      onChange={handleInputChange}
                      placeholder={displayFormat.toLowerCase()}
                      maskPlaceholder={displayFormat.toLowerCase()}
                      ref={ref}
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
  },
)
