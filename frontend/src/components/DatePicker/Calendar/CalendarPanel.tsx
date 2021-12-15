import {
  Box,
  forwardRef,
  SimpleGrid,
  Stack,
  useStyles,
  Wrap,
} from '@chakra-ui/react'
import { isSameDay } from 'date-fns'

import { DAY_NAMES, generateClassNameForDate } from '../utils'

import { useCalendar } from './CalendarContext'
import { DayOfMonth } from './DayOfMonth'

// eslint-disable-next-line @typescript-eslint/ban-types
export const CalendarPanel = forwardRef<{}, 'button'>(
  (_, initialFocusRef): JSX.Element => {
    const styles = useStyles()
    const {
      uuid,
      isDateUnavailable,
      isDateFocusable,
      dateToFocus,
      renderProps: { calendars, getDateProps },
    } = useCalendar()

    return (
      <Wrap shouldWrapChildren spacing="2rem" sx={styles.calendarContainer}>
        {calendars.map((calendar) => (
          <Stack key={`${calendar.month}${calendar.year}`}>
            <SimpleGrid columns={DAY_NAMES.length} sx={styles.monthGrid}>
              {DAY_NAMES.map((dayName, index) => (
                <Box key={index} sx={styles.dayNamesContainer}>
                  {dayName}
                </Box>
              ))}
              {calendar.weeks.map((week, windex) =>
                week.map((dateObj, index) => {
                  if (!dateObj) {
                    return null
                  }
                  const { date, selected, today } = dateObj
                  return (
                    <DayOfMonth
                      key={`${calendar.month}${calendar.year}${windex}${index}`}
                      {...getDateProps({
                        dateObj,
                      })}
                      date={date}
                      isSelected={selected}
                      isAvailable={!isDateUnavailable?.(date)}
                      // Use the latest date for today rather than the memoised today,
                      // since this doesn't affect offset logic
                      isToday={today}
                      isOutsideCurrMonth={date.getMonth() !== calendar.month}
                      isFocusable={isDateFocusable(date)}
                      className={generateClassNameForDate(uuid, date)}
                      ref={
                        isSameDay(date, dateToFocus)
                          ? initialFocusRef
                          : undefined
                      }
                    />
                  )
                }),
              )}
            </SimpleGrid>
          </Stack>
        ))}
      </Wrap>
    )
  },
)
