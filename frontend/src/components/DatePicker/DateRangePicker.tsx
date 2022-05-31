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
  UseProvideCalendarProps,
} from './Calendar'

export interface DateRangePickerProps extends UseProvideCalendarProps {
  /**
   * Selected date range pair. Undefined if no date is selected.
   */
  selectedDates?: Date[]
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
