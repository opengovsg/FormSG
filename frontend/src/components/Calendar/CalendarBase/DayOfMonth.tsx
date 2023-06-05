import { useCallback, useMemo } from 'react'
import {
  ButtonProps,
  chakra,
  Flex,
  forwardRef,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import {
  compareAsc,
  isFirstDayOfMonth,
  isLastDayOfMonth,
  isSameDay,
} from 'date-fns'
import { DateObj } from 'dayzed'

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
      colorScheme,
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

    const styles = useMultiStyleConfig('Calendar', {
      isSelected: selected,
      isToday: today,
      isOutsideCurrMonth,
      colorScheme,
    })

    const buttonBoxBg = useMemo(() => {
      const gradientColor = `var(--chakra-colors-${colorScheme}-200)`
      let gradientTo: 'left' | 'right' | undefined
      // Only style background if it is a range.
      if (Array.isArray(selectedDates)) {
        const [startDate, endDate] = selectedDates
        // Case 1: Both dates selected and equal, no need for background.
        if (startDate && endDate && isSameDay(startDate, endDate)) {
          return
        }
        // Case 2: Hovered date with previously selected date.
        // Background corner should follow date that is hovered.
        if (hoveredDate && startDate && !endDate) {
          if (isSameDay(hoveredDate, date)) {
            gradientTo =
              compareAsc(hoveredDate, selectedDates[0]) === 1 ? 'left' : 'right'
          }
        }
        // Case 3: Current date is a selected date.
        if (startDate && isSameDay(startDate, date)) {
          gradientTo = 'right'
          // Case 4: Only one date selected, background corner should follow
          // date that is selected.
          if (hoveredDate && startDate && !endDate) {
            if (compareAsc(selectedDates[0], hoveredDate) === 1) {
              gradientTo = 'left'
            }
          }
        }
        // Case 5: Current date is the later selected date.
        if (endDate && isSameDay(endDate, date)) {
          gradientTo = 'left'
        }
        if (
          (isFirstDayOfMonth(date) && gradientTo === 'left') ||
          (isLastDayOfMonth(date) && gradientTo === 'right')
        ) {
          return `linear-gradient(to ${gradientTo}, white 50%,${gradientColor} 50%,${gradientColor} 80%,white)`
        }
        if (gradientTo) {
          return `linear-gradient(to ${gradientTo}, transparent 50%,${gradientColor} 50%)`
        }
        // Case 6: In range but none of the above criteria. Means in between range.
        if (isInRange) {
          if (isLastDayOfMonth(date)) {
            return `linear-gradient(to right, ${gradientColor} 75%,white)`
          }
          if (isFirstDayOfMonth(date)) {
            return `linear-gradient(to left, ${gradientColor} 75%,white)`
          }
          return `${colorScheme}.200`
        }
      }
      // Case 7. Not in a range, no background
      return
    }, [colorScheme, date, hoveredDate, isInRange, selectedDates])

    const boxBg = useMemo(() => {
      if (selected) {
        return `${colorScheme}.500`
      }
      if (!isInRange) return
      if (isLastDayOfMonth(date) || isFirstDayOfMonth(date)) {
        if (hoveredDate && isSameDay(hoveredDate, date)) {
          return `${colorScheme}.200`
        }
        return 'transparent'
      }
      return `${colorScheme}.200`
    }, [colorScheme, date, hoveredDate, isInRange, selected])

    return (
      <Flex
        justify="center"
        bg={buttonBoxBg}
        px="2px"
        _focusWithin={{ zIndex: 1 }}
      >
        <chakra.button
          onMouseEnter={handleMouseEnter}
          bg={boxBg}
          // Prevent form submission if this component is nested in a form.
          type="button"
          sx={styles.dayOfMonth}
          aria-label={date.toLocaleDateString()}
          tabIndex={isFocusable ? 0 : -1}
          aria-disabled={!isAvailable}
          ref={ref}
          {...props}
        >
          {date.getDate()}
        </chakra.button>
      </Flex>
    )
  },
)
