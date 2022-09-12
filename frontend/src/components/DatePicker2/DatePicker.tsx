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
} from '@chakra-ui/react'
import { format, isValid, parse } from 'date-fns'

import { BxCalendar } from '~assets/icons'
import { ThemeColorScheme } from '~theme/foundations/colours'
import DateInput from '~components/DatePicker'
import IconButton from '~components/IconButton'
import Input, { InputProps } from '~components/Input'

export interface DatePickerProps
  extends Omit<
    InputProps,
    'value' | 'defaultValue' | 'onChange' | 'colorScheme'
  > {
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
  /** Function to determine whether a date should be made unavailable. */
  isDateUnavailable?: (d: Date) => boolean
  /** Color scheme for date picker component */
  colorScheme?: ThemeColorScheme
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
      colorScheme,
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
      internalValue instanceof Date
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
      (onClose: () => void) => (date: Date) => {
        if (allowInvalidDates || isValid(date)) {
          setInternalValue(date)
        }
        setInputDisplay(format(date, displayFormat, { locale }))
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
                <Flex flex={1}>
                  <InputTriggerOrFragment>
                    <Input
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
              </Portal>
            </>
          )}
        </Popover>
      </Flex>
    )
  },
)
