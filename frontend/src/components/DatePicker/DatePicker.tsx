import { useCallback, useMemo, useState } from 'react'
import { Box, Flex, Select, SimpleGrid, Text } from '@chakra-ui/react'
import { addMonths } from 'date-fns'
import { useDayzed } from 'dayzed'

import { BxChevronLeft, BxChevronRight } from '~assets/icons'
import IconButton from '~components/IconButton'

import { DayOfMonth } from './DayOfMonth'
import { Month } from './Month'
import {
  DAY_NAMES,
  getMonthOffsetFromToday,
  getYearOptions,
  MONTH_NAMES,
  normaliseMonth,
} from './utils'

export const DatePicker = (): JSX.Element => {
  const [currMonth, setCurrMonth] = useState<number>(new Date().getMonth())
  const [currYear, setCurrYear] = useState<number>(new Date().getFullYear())
  const yearOptions = useMemo(() => getYearOptions(), [])
  const handleMonthChange = useCallback(
    (month: number): void => setCurrMonth(normaliseMonth(month)),
    [],
  )
  const handleOffsetChange = useCallback(
    (offset: number) => {
      const yearAfterOffset = addMonths(
        new Date(currYear, currMonth),
        offset,
      ).getFullYear()
      setCurrYear(yearAfterOffset)
      setCurrMonth((currMonth) => normaliseMonth(currMonth + offset))
    },
    [currMonth, currYear, setCurrMonth, setCurrYear],
  )
  const { calendars, getForwardProps, getBackProps, getDateProps } = useDayzed({
    onDateSelected: (things) => console.log(things),
    showOutsideDays: true,
    // Initial offset from current date; this tells Dayzed that we
    // are controlling the offset
    offset: getMonthOffsetFromToday(currMonth, currYear),
    onOffsetChanged: handleOffsetChange,
  })

  return (
    // Overall container
    <Box>
      {/* Month, year selectors */}
      <Flex justifyContent="space-between">
        <Flex justifyContent="flex-start">
          <Select
            value={currMonth}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
          >
            {MONTH_NAMES.map((monthName, index) => (
              <option value={index} key={index}>
                {monthName}
              </option>
            ))}
          </Select>
          <Select
            value={currYear}
            onChange={(e) => setCurrYear(Number(e.target.value))}
          >
            {yearOptions.map((year, index) => (
              <option value={year} key={index}>
                {year}
              </option>
            ))}
          </Select>
        </Flex>
        <Flex justifyContent="flex-end">
          <IconButton
            variant="clear"
            icon={<BxChevronLeft />}
            aria-label="Back one month"
            {...getBackProps({ calendars })}
          />
          <IconButton
            variant="clear"
            icon={<BxChevronRight />}
            aria-label="Forward one month"
            {...getForwardProps({ calendars })}
          />
        </Flex>
      </Flex>
      {/* Calendars is an array, but it should only have 1 element since
      we only render 1 month at a time */}
      {calendars.map((calendar) => (
        <Month key={`${calendar.month}${calendar.year}`}>
          <SimpleGrid columns={DAY_NAMES.length}>
            {DAY_NAMES.map((dayName) => (
              <Text textStyle="subhead-2" margin="auto">
                {dayName}
              </Text>
            ))}
            {calendar.weeks.map((week, windex) =>
              week.map((dateObj, index) => {
                const key = `${calendar.month}${calendar.year}${windex}${index}`
                if (!dateObj) {
                  return <DayOfMonth key={key} />
                }
                const { date, selected, selectable, today } = dateObj
                return (
                  <DayOfMonth
                    key={key}
                    {...getDateProps({
                      dateObj,
                    })}
                    selected={selected}
                    unavailable={!selectable}
                    today={today}
                  >
                    {selectable ? date.getDate() : 'X'}
                  </DayOfMonth>
                )
              }),
            )}
          </SimpleGrid>
        </Month>
      ))}
    </Box>
  )
}
