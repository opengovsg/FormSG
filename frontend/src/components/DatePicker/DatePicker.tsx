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
            <CalendarPanel ref={initialFocusRef} />
            <CalendarTodayButton />
          </Box>
        </StylesProvider>
      </CalendarProvider>
    )
  },
)
