import {
  Box,
  forwardRef,
  StylesProvider,
  useControllableState,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { DATE_INPUT_THEME_KEY } from '~theme/components/DateInput'
import { ThemeColorScheme } from '~theme/foundations/colours'

import { CalendarProvider } from './CalendarBase/CalendarContext'
import { CalendarPanel } from './CalendarBase/CalendarPanel'
import { CalendarTodayButton } from './CalendarBase/CalendarTodayButton'
import { CalendarBaseProps } from './CalendarBase/types'

export interface CalendarProps extends CalendarBaseProps {
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
  /** Function to determine whether a date should be made unavailable. */
  isDateUnavailable?: (d: Date) => boolean
  /** Color scheme for component */
  colorScheme?: ThemeColorScheme
}

export const Calendar = forwardRef<CalendarProps, 'input'>(
  ({ value, onChange, defaultValue, ...props }, initialFocusRef) => {
    const styles = useMultiStyleConfig(DATE_INPUT_THEME_KEY, props)

    const [internalValue, setInternalValue] = useControllableState({
      value,
      onChange,
      defaultValue,
    })

    return (
      <CalendarProvider
        {...props}
        selectedDates={internalValue ?? undefined}
        onSelectDate={setInternalValue}
      >
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
