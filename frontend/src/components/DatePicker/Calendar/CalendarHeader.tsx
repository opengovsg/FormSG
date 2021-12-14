import { ChangeEvent, useCallback } from 'react'
import {
  Flex,
  HStack,
  Select,
  SelectProps,
  useBreakpointValue,
  useStyles,
} from '@chakra-ui/react'
import { RenderProps } from 'dayzed'

import { BxChevronLeft, BxChevronRight } from '~assets/icons'
import IconButton from '~components/IconButton'

import { MONTH_NAMES } from '../utils'

import { useCalendar } from './CalendarContext'

export interface CalendarHeaderProps {
  renderProps: RenderProps
  currMonth: number
  onMonthChange: (month: number) => void
  currYear: number
  onYearChange: (year: number) => void
  shouldUseMonthFullName?: boolean
  yearOptions: number[]
}

const MonthYearSelect = ({
  children,
  ...props
}: { children: React.ReactNode } & SelectProps) => {
  return (
    <Select
      // Prevents any parent form control from applying error styles to this select.
      isInvalid={false}
      color="secondary.500"
      flexBasis="fit-content"
      borderColor="transparent"
      cursor="pointer"
      _hover={{
        borderColor: 'transparent',
      }}
      _focus={{
        boxShadow: '0 0 0 4px var(--chakra-colors-secondary-300)',
      }}
      {...props}
    >
      {children}
    </Select>
  )
}

export const CalendarHeader = (): JSX.Element => {
  const styles = useStyles()
  const {
    currMonth,
    setCurrMonth,
    currYear,
    setCurrYear,
    yearOptions,
    renderProps: { calendars, getBackProps, getForwardProps },
  } = useCalendar()

  const shouldUseMonthFullName = useBreakpointValue({
    base: false,
    md: true,
  })

  const handleMonthChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setCurrMonth(parseInt(e.target.value))
    },
    [setCurrMonth],
  )
  const handleYearChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setCurrYear(parseInt(e.target.value))
    },
    [setCurrYear],
  )

  return (
    <Flex sx={styles.monthYearSelectorContainer}>
      <HStack>
        <MonthYearSelect
          value={currMonth}
          onChange={handleMonthChange}
          aria-label="Change displayed month"
          // Align with dates
          pl={{ base: '0', md: '2px' }}
        >
          {MONTH_NAMES.map(({ shortName, fullName }, index) => (
            <option value={index} key={index}>
              {shouldUseMonthFullName ? fullName : shortName}
            </option>
          ))}
        </MonthYearSelect>
        <MonthYearSelect
          value={currYear}
          onChange={handleYearChange}
          aria-label="Change displayed year"
        >
          {yearOptions.map((year, index) => (
            <option value={year} key={index}>
              {year}
            </option>
          ))}
        </MonthYearSelect>
      </HStack>
      <Flex sx={styles.monthArrowContainer}>
        <IconButton
          variant="clear"
          colorScheme="secondary"
          icon={<BxChevronLeft />}
          aria-label="Back one month"
          minW={{ base: '1.75rem', xs: '2.75rem', sm: '2.75rem' }}
          {...getBackProps({ calendars })}
        />
        <IconButton
          variant="clear"
          colorScheme="secondary"
          icon={<BxChevronRight />}
          aria-label="Forward one month"
          minW={{ base: '1.75rem', xs: '2.75rem', sm: '2.75rem' }}
          {...getForwardProps({ calendars })}
        />
      </Flex>
    </Flex>
  )
}
