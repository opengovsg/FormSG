import { useCallback, useMemo } from 'react'
import {
  Box,
  ButtonProps,
  chakra,
  forwardRef,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { compareAsc, format, isSameDay } from 'date-fns'
import { DateObj } from 'dayzed'

import { DATE_INPUT_THEME_KEY } from '~theme/components/DateInput'

import { useCalendar } from './CalendarContext'

export interface DayOfMonthProps extends ButtonProps {
  /**
   * DateObj to decide what is rendered.
   */
  dateObj: DateObj
  /**
   * Whether this date falls outside the range of the
   * month currently being displayed.
   */
  isOutsideCurrMonth?: boolean
}

export const DayOfMonth = forwardRef<DayOfMonthProps, 'button'>(
  (
    { dateObj: { date, selected, today }, isOutsideCurrMonth, ...props },
    ref,
  ) => {
    const {
      isDateUnavailable,
      isDateFocusable,
      onMouseEnterHighlight,
      isDateInRange,
      selectedDates,
      hoveredDate,
    } = useCalendar()

    const isAvailable = useMemo(
      () => !isDateUnavailable?.(date),
      [date, isDateUnavailable],
    )
    const isFocusable = useMemo(
      () => isDateFocusable(date),
      [date, isDateFocusable],
    )
    const isInRange = useMemo(
      () => isDateInRange?.(date),
      [date, isDateInRange],
    )

    const handleMouseEnter = useCallback(
      () => onMouseEnterHighlight?.(date),
      [date, onMouseEnterHighlight],
    )

    const styles = useMultiStyleConfig(DATE_INPUT_THEME_KEY, {
      isSelected: selected,
      isToday: today,
      isInRange,
      isOutsideCurrMonth,
    })

    const buttonBg = useMemo(() => {
      let gradientTo: 'left' | 'right' | undefined
      // Only style background if it is a range.
      if (Array.isArray(selectedDates)) {
        // Case 1: Both dates selected and equal, no need for background.
        if (isSameDay(selectedDates[0], selectedDates[1])) {
          return
        }
        // Case 2: Hovered date with previously selected date.
        // Background corner should follow date that is hovered.
        if (hoveredDate && selectedDates.length === 1) {
          if (isSameDay(hoveredDate, date)) {
            gradientTo =
              compareAsc(hoveredDate, selectedDates[0]) === 1 ? 'left' : 'right'
          }
        }
        // Case 3: Current date is a selected date.
        if (isSameDay(selectedDates[0], date)) {
          gradientTo = 'right'
          // Case 4: Only one date selected, background corner should follow
          // date that is selected.
          if (
            hoveredDate &&
            selectedDates.length === 1 &&
            compareAsc(selectedDates[0], hoveredDate) === 1
          ) {
            gradientTo = 'left'
          }
        }
        // Case 5: Current date is the later selected date.
        if (isSameDay(selectedDates[1], date)) {
          gradientTo = 'left'
        }
        if (gradientTo) {
          return `linear-gradient(to ${gradientTo}, transparent 50%,var(--chakra-colors-primary-200) 50%)`
        }
        // Case 6: In range but none of the above criteria. Means in between range.
        if (isInRange) {
          return 'primary.200'
        }
      }
      // Case 7. Not in a range, no background
      return
    }, [date, hoveredDate, isInRange, selectedDates])

    return (
      <Box bg={buttonBg} px="2px">
        <chakra.button
          onMouseEnter={handleMouseEnter}
          // Prevent form submission if this component is nested in a form.
          type="button"
          sx={styles.dayOfMonth}
          aria-label={format(date, "do 'of' MMMM',' EEEE")}
          tabIndex={isFocusable ? 0 : -1}
          aria-disabled={!isAvailable}
          ref={ref}
          {...props}
        >
          {date.getDate()}
        </chakra.button>
      </Box>
    )
  },
)
