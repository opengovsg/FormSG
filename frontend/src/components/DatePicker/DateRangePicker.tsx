import {
  Box,
  forwardRef,
  StylesProvider,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { DATE_INPUT_THEME_KEY } from '~theme/components/DateInput'

import {
  CalendarPanel,
  CalendarProvider,
  CalendarTodayButton,
} from './Calendar'

export interface DateRangePickerProps {
  /**
   * Selected date range pair. Undefined if no date is selected.
   */
  selectedDates?: Date[]

  /**
   * Handler for when date is selected.
   */
  onSelectDate: (d: Date) => void

  /**
   * Function to determine whether a date should be made
   * unavailable.
   */
  isDateUnavailable?: (d: Date) => boolean

  /**
   * Function to be passed to CalendarPanel to determine range styling.
   */
  isDateInRange: (d: Date) => boolean | null

  /**
   * Function to be passed to CalendarPanel to determine range styling.
   * Called when a date is selected and a mouseover is detected over a date.
   */
  onMouseEnterHighlight: (date: Date) => void

  /**
   * Function to be passed to CalendarPanel to determine range styling.
   * Called when mouse leaves the calendar.
   */
  onMouseLeaveCalendar: () => void
}

export const DateRangePicker = forwardRef<DateRangePickerProps, 'input'>(
  (props, initialFocusRef) => {
    const styles = useMultiStyleConfig(DATE_INPUT_THEME_KEY, {})

    return (
      <CalendarProvider monthsToDisplay={2} {...props}>
        <StylesProvider value={styles}>
          {/* Overall container */}
          <Box sx={styles.container}>
            <CalendarPanel ref={initialFocusRef} />
            <CalendarTodayButton />
          </Box>
        </StylesProvider>
      </CalendarProvider>
    )
  },
)
