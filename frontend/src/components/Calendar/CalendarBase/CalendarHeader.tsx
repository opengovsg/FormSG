import { ChangeEvent, memo, useCallback, useMemo } from 'react'
import {
  Flex,
  HStack,
  Select,
  SelectProps,
  Text,
  useBreakpointValue,
  useStyles,
} from '@chakra-ui/react'
import { addMonths } from 'date-fns'

import { BxChevronLeft, BxChevronRight } from '~assets/icons'
import IconButton from '~components/IconButton'

import { useCalendar } from './CalendarContext'
import { MONTH_NAMES } from './utils'

interface CalendarHeaderProps {
  monthOffset: number
}

const MonthYearSelect = ({
  children,
  ...props
}: { children: React.ReactNode } & SelectProps) => {
  return (
    <Select
      // Prevents any parent form control from applying error styles to this select.
      isInvalid={false}
      variant="flushed"
      borderRadius="4px"
      color="secondary.500"
      textStyle="subhead-1"
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

const SelectableMonthYear = memo(() => {
  const { currMonth, setCurrMonth, currYear, setCurrYear, yearOptions } =
    useCalendar()

  const shouldUseMonthFullName = useBreakpointValue({
    base: false,
    xs: false,
    md: true,
  })

  const memoizedMonthOptions = useMemo(() => {
    return MONTH_NAMES.map(({ shortName, fullName }, index) => (
      <option value={index} key={index}>
        {shouldUseMonthFullName ? fullName : shortName}
      </option>
    ))
  }, [shouldUseMonthFullName])

  const memoizedYearOptions = useMemo(() => {
    return yearOptions.map((year, index) => (
      <option value={year} key={index}>
        {year}
      </option>
    ))
  }, [yearOptions])

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
    <HStack>
      <MonthYearSelect
        // Align with dates in the calendar
        pl={{ base: '0.5rem', md: '1rem' }}
        value={currMonth}
        onChange={handleMonthChange}
        aria-label="Change displayed month"
      >
        {memoizedMonthOptions}
      </MonthYearSelect>
      <MonthYearSelect
        value={currYear}
        onChange={handleYearChange}
        aria-label="Change displayed year"
      >
        {memoizedYearOptions}
      </MonthYearSelect>
    </HStack>
  )
})

const MonthYear = memo(({ monthOffset }: CalendarHeaderProps) => {
  const { currMonth, currYear } = useCalendar()
  const shouldUseMonthFullName = useBreakpointValue({
    base: false,
    xs: false,
    md: true,
  })

  const newOffsetDate = useMemo(
    () => addMonths(new Date(currYear, currMonth), monthOffset),
    [currMonth, currYear, monthOffset],
  )

  const monthDisplay = useMemo(() => {
    const month = MONTH_NAMES[newOffsetDate.getMonth()]
    return shouldUseMonthFullName ? month.fullName : month.shortName
  }, [newOffsetDate, shouldUseMonthFullName])

  const yearDisplay = useMemo(() => {
    return newOffsetDate.getFullYear()
  }, [newOffsetDate])

  return (
    <HStack
      ml={{ base: '0.5rem', md: '1rem' }}
      textStyle="subhead-1"
      color="secondary.500"
      spacing="1.5rem"
    >
      <Text>{monthDisplay}</Text>
      <Text>{yearDisplay}</Text>
    </HStack>
  )
})

export const CalendarHeader = memo(
  ({ monthOffset }: CalendarHeaderProps): JSX.Element => {
    const styles = useStyles()
    const {
      renderProps: { calendars, getBackProps, getForwardProps },
    } = useCalendar()

    return (
      <Flex sx={styles.monthYearSelectorContainer}>
        {monthOffset === 0 ? (
          <SelectableMonthYear />
        ) : (
          <MonthYear monthOffset={monthOffset} />
        )}
        {calendars.length - 1 === monthOffset ? (
          <Flex sx={styles.monthArrowContainer}>
            <IconButton
              variant="clear"
              colorScheme="secondary"
              icon={<BxChevronLeft />}
              aria-label="Back one month"
              {...getBackProps({ calendars })}
            />
            <IconButton
              variant="clear"
              colorScheme="secondary"
              icon={<BxChevronRight />}
              aria-label="Forward one month"
              {...getForwardProps({ calendars })}
            />
          </Flex>
        ) : null}
      </Flex>
    )
  },
)
