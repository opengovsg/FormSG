import { useMemo } from 'react'
import {
  chakra,
  forwardRef,
  Stack,
  Text,
  VisuallyHidden,
} from '@chakra-ui/react'
import { addDays, isSameDay, startOfWeek } from 'date-fns'
import { DateObj } from 'dayzed'

import { useCalendar } from './CalendarContext'
import { CalendarHeader } from './CalendarHeader'
import { useCalendarStyles } from './CalendarStyleProvider'
import { DayOfMonth } from './DayOfMonth'
import { DAY_NAMES, generateClassNameForDate, MONTH_NAMES } from './utils'

// Any month spans at most 6 week-rows; padding to this keeps the calendar height stable.
const MAX_WEEKS_IN_MONTH = 6

export const CalendarPanel = forwardRef<object, 'button'>(
  (_props, initialFocusRef): JSX.Element => {
    const styles = useCalendarStyles()
    const {
      classNameId,
      dateToFocus,
      selectedDates,
      onMouseLeaveCalendar,
      renderProps: { calendars, getDateProps },
    } = useCalendar()

    // Pinned to the first render so "today" doesn't shift if the picker is
    // left open past midnight.
    const today = useMemo(() => new Date(), [])

    return (
      <Stack
        direction={{ base: 'column', md: 'row' }}
        spacing="2rem"
        sx={styles.calendarContainer}
        onMouseLeave={onMouseLeaveCalendar}
      >
        {calendars.map((calendar, i) => (
          <Stack spacing={0} key={i}>
            <CalendarHeader monthOffset={i} />
            <chakra.table
              aria-label={`${MONTH_NAMES[calendar.month].fullName} ${
                calendar.year
              }`}
              key={`${calendar.month}${calendar.year}`}
              sx={styles.monthGrid}
            >
              <chakra.thead>
                <chakra.tr>
                  {DAY_NAMES.map(({ fullName, shortName }, index) => (
                    <chakra.th key={index} sx={styles.dayNamesContainer}>
                      <Text aria-hidden>{shortName}</Text>
                      <VisuallyHidden>{fullName}</VisuallyHidden>
                    </chakra.th>
                  ))}
                </chakra.tr>
              </chakra.thead>
              <chakra.tbody>
                {calendar.weeks.map((week, windex) => {
                  return (
                    <chakra.tr key={windex}>
                      {week.map((dateObj, index) => {
                        if (!dateObj) {
                          return (
                            <chakra.td
                              key={`${calendar.month}${calendar.year}${windex}${index}`}
                            />
                          )
                        }
                        return (
                          <chakra.td
                            key={`${calendar.month}${calendar.year}${windex}${index}`}
                          >
                            <DayOfMonth
                              {...getDateProps({
                                dateObj,
                              })}
                              dateObj={dateObj}
                              isOutsideCurrMonth={
                                dateObj.date.getMonth() !== calendar.month
                              }
                              className={generateClassNameForDate(
                                classNameId,
                                dateObj.date,
                              )}
                              ref={
                                isSameDay(dateObj.date, dateToFocus)
                                  ? initialFocusRef
                                  : undefined
                              }
                            />
                          </chakra.td>
                        )
                      })}
                    </chakra.tr>
                  )
                })}
                {/* Skip for range picker — it already shows next month alongside. */}
                {Array.from(
                  {
                    length:
                      calendars.length === 1
                        ? MAX_WEEKS_IN_MONTH - calendar.weeks.length
                        : 0,
                  },
                  (_filler, windex) => (
                    <chakra.tr key={`filler-${windex}`}>
                      {DAY_NAMES.map((_dayName, index) => {
                        const date = addDays(
                          startOfWeek(
                            new Date(calendar.year, calendar.month, 1),
                          ),
                          (calendar.weeks.length + windex) * 7 + index,
                        )
                        const dateObj: DateObj = {
                          date,
                          selectable: true,
                          selected:
                            selectedDates instanceof Date &&
                            isSameDay(date, selectedDates),
                          today: isSameDay(date, today),
                          prevMonth: false,
                          nextMonth: true,
                        }
                        return (
                          <chakra.td
                            key={`filler-${calendar.month}${calendar.year}${windex}${index}`}
                          >
                            <DayOfMonth
                              {...getDateProps({ dateObj })}
                              dateObj={dateObj}
                              isOutsideCurrMonth
                              className={generateClassNameForDate(
                                classNameId,
                                date,
                              )}
                            />
                          </chakra.td>
                        )
                      })}
                    </chakra.tr>
                  ),
                )}
              </chakra.tbody>
            </chakra.table>
            <VisuallyHidden aria-live="polite">
              Cursor keys can navigate dates when a date is being focused.
            </VisuallyHidden>
          </Stack>
        ))}
      </Stack>
    )
  },
)
