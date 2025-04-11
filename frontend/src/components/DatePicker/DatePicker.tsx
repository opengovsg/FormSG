import { forwardRef } from '@chakra-ui/react'

import { CalendarProps } from '~components/Calendar'

import { DatePickerCalendar } from './components/DatePickerCalendar'
import { DatePickerContent } from './components/DatePickerContent'
import { DatePickerWrapper } from './components/DatePickerWrapper'
import { DatePickerProvider } from './DatePickerContext'
import { DatePickerBaseProps } from './types'

export interface DatePickerProps extends DatePickerBaseProps, CalendarProps {
  /**
   * Value to display in input, derived from the selected date.
   * If provided, input will be controlled, and empty string denotes no date selection.
   */
  inputValue?: string
  /** If provided, callback will be fired when the controlled input value changes. */
  onInputValueChange?: (value: string) => void
  /** Default value for uncontrolled input. */
  defaultInputValue?: string
  /** Whether the date picker is in a high contrast state. */
  highContrast?: boolean
}

export const DatePicker = forwardRef<DatePickerProps, 'input'>((props, ref) => {
  return (
    <DatePickerProvider {...props}>
      <DatePickerWrapper ref={ref} highContrast={props.highContrast}>
        <DatePickerContent>
          <DatePickerCalendar />
        </DatePickerContent>
      </DatePickerWrapper>
    </DatePickerProvider>
  )
})
