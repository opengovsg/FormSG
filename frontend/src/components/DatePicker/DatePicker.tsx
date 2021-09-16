import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Flex, Select } from '@chakra-ui/react'
import { useDayzed } from 'dayzed'

import { BxChevronLeft, BxChevronRight } from '~assets/icons'
import IconButton from '~components/IconButton'

import { getYearOptions, MONTH_NAMES } from './utils'

export const DatePicker = (): JSX.Element => {
  const [currMonth, setCurrMonth] = useState<number>(new Date().getMonth())
  const [currYear, setCurrYear] = useState<number>(new Date().getFullYear())
  const yearOptions = useMemo(() => getYearOptions(), [])
  const handleMonthChange = useCallback(
    (month: number): void => {
      if (month < 0) {
        setCurrMonth((month % 12) + MONTH_NAMES.length)
        // Assumes yearOptions is ascending
        if (currYear > yearOptions[0]) {
          setCurrYear((currYear) => currYear - 1)
        }
      } else if (month > 11) {
        setCurrMonth(month % 12)
        // Assumes yearOptions is ascending
        if (currYear < yearOptions[yearOptions.length - 1]) {
          setCurrYear((currYear) => currYear + 1)
        }
      } else {
        setCurrMonth(month)
      }
    },
    [currYear, yearOptions],
  )
  const { calendars, getForwardProps, getBackProps } = useDayzed({
    onDateSelected: (things) => console.log(things),
    showOutsideDays: true,
  })
  useEffect(() => console.log(currMonth), [currMonth])
  useEffect(() => console.log(currYear), [currYear])
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
            onClick={() => handleMonthChange(currMonth - 1)}
            aria-label="Back one month"
            {...getBackProps({ calendars })}
          />
          <IconButton
            variant="clear"
            icon={<BxChevronRight />}
            onClick={() => handleMonthChange(currMonth + 1)}
            aria-label="Forward one month"
            {...getForwardProps({ calendars })}
          />
        </Flex>
      </Flex>
    </Box>
  )
}
