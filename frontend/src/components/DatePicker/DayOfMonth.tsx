import {
  Box,
  BoxProps,
  forwardRef,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { format } from 'date-fns'

import { DATE_INPUT_THEME_KEY } from '~theme/components/DateInput'

export interface DayOfMonthProps extends BoxProps {
  /**
   * Date represented by this day of month.
   */
  date: Date
  /**
   * Whether this date is currently selected.
   */
  isSelected?: boolean
  /**
   * Whether this date is available to be selected.
   */
  isAvailable?: boolean
  /**
   * Whether this date is the current date.
   */
  isToday?: boolean
  /**
   * Whether this date falls outside the range of the
   * month currently being displayed.
   */
  isOutsideCurrMonth?: boolean
  /**
   * Whether this date should be placed in the tabbing
   * sequence.
   */
  isFocusable?: boolean
}

export const DayOfMonth = forwardRef<DayOfMonthProps, 'button'>(
  (
    {
      date,
      isSelected,
      isAvailable,
      isToday,
      isOutsideCurrMonth,
      isFocusable,
      ...props
    },
    ref,
  ) => {
    const styles = useMultiStyleConfig(DATE_INPUT_THEME_KEY, {
      isSelected,
      isOutsideCurrMonth,
      isToday,
    })

    return (
      <Box
        as="button"
        {...props}
        __css={styles.dayOfMonth}
        aria-label={format(date, "do 'of' MMMM',' EEEE")}
        disabled={!isAvailable}
        tabIndex={isFocusable ? 0 : -1}
        ref={ref}
      >
        {date.getDate()}
      </Box>
    )
  },
)
