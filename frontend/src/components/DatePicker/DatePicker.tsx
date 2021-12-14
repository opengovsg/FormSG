import {
  Box,
  forwardRef,
  StylesProvider,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { DATE_INPUT_THEME_KEY } from '~theme/components/DateInput'

import { CalendarProvider } from './CalendarContext'
import { CalendarHeader } from './CalendarHeader'
import { CalendarPanel } from './CalendarPanel'
import { CalendarTodayButton } from './CalendarTodayButton'

export interface DatePickerProps {
  /**
   * Selected date. Undefined if no date is selected.
   */
  date?: Date
  /**
   * Handler for when date is selected.
   */
  onSelectDate: (d: Date) => void
  /**
   * Function to determine whether a date should be made
   * unavailable.
   */
  isDateUnavailable?: (d: Date) => boolean
}

export const DatePicker = forwardRef<DatePickerProps, 'input'>(
  (props, initialFocusRef) => {
    const styles = useMultiStyleConfig(DATE_INPUT_THEME_KEY, {})

    return (
      <CalendarProvider {...props}>
        <StylesProvider value={styles}>
          {/* Overall container */}
          <Box sx={styles.container}>
            {/* Month, year selectors */}
            <CalendarHeader />
            {/* Calendars is an array, but it should only have 1 element since
      we only render 1 month at a time */}
            <CalendarPanel ref={initialFocusRef} />
            <CalendarTodayButton />
          </Box>
        </StylesProvider>
      </CalendarProvider>
    )
  },
)
