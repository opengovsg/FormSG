import { Box, forwardRef, SimpleGrid, Stack, useStyles } from '@chakra-ui/react'
import { isSameDay } from 'date-fns'

import { DAY_NAMES, generateClassNameForDate } from '../utils'

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
            <SimpleGrid
              key={`${calendar.month}${calendar.year}`}
              columns={DAY_NAMES.length}
              sx={styles.monthGrid}
            >
              {DAY_NAMES.map((dayName, index) => (
                <Box key={index} sx={styles.dayNamesContainer}>
                  {dayName}
                </Box>
              ))}
              {calendar.weeks.map((week, windex) =>
                week.map((dateObj, index) => {
                  if (!dateObj) {
                    return (
                      <Box
                        key={`${calendar.month}${calendar.year}${windex}${index}`}
                      />
                    )
                  }
                  return (
                    <DayOfMonth
                      key={`${calendar.month}${calendar.year}${windex}${index}`}
                      {...getDateProps({
                        dateObj,
                      })}
                      dateObj={dateObj}
                      className={generateClassNameForDate(uuid, dateObj.date)}
                      ref={
                        isSameDay(dateObj.date, dateToFocus)
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
      </Stack>
    )
  },
)
