import { useCallback, useState } from 'react'
import {
  Box,
  forwardRef,
  StylesProvider,
  useControllableState,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { compareAsc } from 'date-fns'

import {
  CalendarAria,
  CalendarBaseProps,
  CalendarPanel,
  CalendarProvider,
  CalendarTodayButton,
  DateRangeValue,
} from './CalendarBase'

export interface RangeCalendarProps extends CalendarBaseProps {
  /**
   * The current selected date range pair.
   * If provided, the input will be a controlled input, and `onChange` must be provided.
   */
  value?: DateRangeValue
  /**
   * Callback fired when the date changes.
   * If `value` is provided, this must be provided.
   */
  onChange?: (value: DateRangeValue) => void
  /** The default selected date, used if input is uncontrolled */
  defaultValue?: DateRangeValue
}

export const RangeCalendar = forwardRef<RangeCalendarProps, 'input'>(
  (
    {
      value,
      onChange,
      defaultValue = [null, null],
      monthsToDisplay = 2,
      ...props
    },
    initialFocusRef,
  ) => {
    const styles = useMultiStyleConfig('Calendar', props)

    const [hoveredDate, setHoveredDate] = useState<Date>()

    const [internalValue, setInternalValue] = useControllableState({
      value,
      onChange,
      defaultValue,
    })

    const [startDate, endDate] = internalValue

    /**
     * Handles date selection in calendar panel.
     * Calls onChange prop (if provided) with sorted dates.
     * @param date the new date selected
     */
    const handleOnDateSelected = useCallback(
      (date: Date) => {
        // Case 1: both dates are null
        if (startDate === null && endDate === null) {
          return setInternalValue([date, null])
        }

        // Case 2: Only first date exists
        if (startDate !== null && endDate === null) {
          // Case 2a: New date is before first date
          if (compareAsc(date, startDate) < 0) {
            return setInternalValue([date, startDate])
          }
          // Case 2b: New date is after first date
          return setInternalValue([startDate, date])
        }

        // Case 3: Both dates exist
        if (startDate !== null && endDate !== null) {
          // Reset to just the new date.
          return setInternalValue([date, null])
        }
      },
      [endDate, setInternalValue, startDate],
    )

    const isDateInRange = useCallback(
      (date: Date) => {
        // Both dates are null.
        if (startDate === null && endDate === null) {
          return false
        }
        // Case 1: Both dates exist.
        if (startDate !== null && endDate !== null) {
          return (
            compareAsc(date, startDate) >= 0 && compareAsc(date, endDate) <= 0
          )
        }

        // Case 2: Nothing is being hovered.
        if (!hoveredDate || !startDate) {
          return false
        }

        // Case 3: Only first date exists and something is being hovered.
        return (
          (compareAsc(date, startDate) >= 0 &&
            compareAsc(date, hoveredDate) <= 0) ||
          (compareAsc(date, startDate) <= 0 &&
            compareAsc(date, hoveredDate) >= 0)
        )
      },
      [endDate, hoveredDate, startDate],
    )

    const onMouseEnterHighlight = useCallback(
      (date: Date) => {
        if (startDate === null && endDate === null) {
          return
        }
        setHoveredDate(date)
      },
      [endDate, startDate],
    )

    const onMouseLeaveCalendar = useCallback(() => {
      setHoveredDate(undefined)
    }, [])

    return (
      <CalendarProvider
        monthsToDisplay={monthsToDisplay}
        selectedDates={internalValue ?? undefined}
        onSelectDate={handleOnDateSelected}
        hoveredDate={hoveredDate}
        onMouseEnterHighlight={onMouseEnterHighlight}
        onMouseLeaveCalendar={onMouseLeaveCalendar}
        isDateInRange={isDateInRange}
        {...props}
      >
        <StylesProvider value={styles}>
          <CalendarAria />
          <Box sx={styles.container}>
            <CalendarPanel ref={initialFocusRef} />
            <CalendarTodayButton />
          </Box>
        </StylesProvider>
      </CalendarProvider>
    )
  },
)
