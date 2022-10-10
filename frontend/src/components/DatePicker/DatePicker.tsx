import { forwardRef } from '@chakra-ui/react'

import { CalendarProps } from '~components/Calendar'

import { CalendarButton } from './components/CalendarButton'
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
}

export const DatePicker = forwardRef<DatePickerProps, 'input'>((props, ref) => {
  return (
    <DatePickerProvider {...props}>
      <DatePickerWrapper ref={ref}>
        <CalendarButton />
        <DatePickerContent>
          <DatePickerCalendar />
        </DatePickerContent>
      </DatePickerWrapper>
    </DatePickerProvider>
  )
})
