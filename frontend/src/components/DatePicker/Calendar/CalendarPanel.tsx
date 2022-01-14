import {
  chakra,
  forwardRef,
  Stack,
  Td,
  useStyles,
  VisuallyHidden,
} from '@chakra-ui/react'
import { isSameDay } from 'date-fns'

import { DAY_NAMES, generateClassNameForDate, MONTH_NAMES } from '../utils'

import { useCalendar } from './CalendarContext'
import { CalendarHeader } from './CalendarHeader'
import { DayOfMonth } from './DayOfMonth'

// eslint-disable-next-line @typescript-eslint/ban-types
export const CalendarPanel = forwardRef<{}, 'button'>(
  (_props, initialFocusRef): JSX.Element => {
    const styles = useStyles()
    const {
      uuid,
      dateToFocus,
      onMouseLeaveCalendar,
      renderProps: { calendars, getDateProps },
    } = useCalendar()

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
                    <chakra.th
                      key={index}
                      abbr={fullName}
                      sx={styles.dayNamesContainer}
                    >
                      {shortName}
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
                            <Td
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
                                uuid,
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
              </chakra.tbody>
            </chakra.table>
          </Stack>
        ))}
        <VisuallyHidden aria-live="polite">
          Cursor keys can navigate dates when a date is being focused.
        </VisuallyHidden>
      </Stack>
    )
  },
)
