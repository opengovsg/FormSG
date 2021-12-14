import { ChangeEvent, useCallback } from 'react'
import { Flex, Select, useStyles } from '@chakra-ui/react'
import { RenderProps } from 'dayzed'

import { BxChevronLeft, BxChevronRight } from '~assets/icons'
import IconButton from '~components/IconButton'

import { MONTH_NAMES } from './utils'

export interface CalendarHeaderProps {
  renderProps: RenderProps
  currMonth: number
  onMonthChange: (month: number) => void
  currYear: number
  onYearChange: (year: number) => void
  shouldUseMonthFullName?: boolean
  yearOptions: number[]
}

export const CalendarHeader = ({
  currMonth,
  onMonthChange,
  shouldUseMonthFullName,
  currYear,
  onYearChange,
  yearOptions,
  renderProps: { calendars, getBackProps, getForwardProps },
}: CalendarHeaderProps): JSX.Element => {
  const styles = useStyles()

  const handleMonthChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onMonthChange(parseInt(e.target.value))
    },
    [onMonthChange],
  )
  const handleYearChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onYearChange(parseInt(e.target.value))
    },
    [onYearChange],
  )

  return (
    <Flex sx={styles.monthYearSelectorContainer}>
      <Flex sx={styles.monthYearDropdownContainer}>
        <Select
          value={currMonth}
          onChange={handleMonthChange}
          // Set styles here since useMultiStyleConfig doesn't play nicely with
          // __css property on Select
          flexBasis="fit-content"
          borderColor="transparent"
          pl={{ base: '0', md: '2px' }} // Align with dates
        >
          {MONTH_NAMES.map(({ shortName, fullName }, index) => (
            <option value={index} key={index}>
              {shouldUseMonthFullName ? fullName : shortName}
            </option>
          ))}
        </Select>
        <Select
          value={currYear}
          onChange={handleYearChange}
          flexBasis="fit-content"
          borderColor="transparent"
        >
          {yearOptions.map((year, index) => (
            <option value={year} key={index}>
              {year}
            </option>
          ))}
        </Select>
      </Flex>
      <Flex __css={styles.monthArrowContainer}>
        <IconButton
          variant="clear"
          icon={<BxChevronLeft />}
          aria-label="Back one month"
          // Styles here because __css property does not achieve our intended styles
          color="secondary.500"
          minW={{ base: '1.75rem', xs: '2.75rem', sm: '2.75rem' }}
          {...getBackProps({ calendars })}
        />
        <IconButton
          variant="clear"
          icon={<BxChevronRight />}
          aria-label="Forward one month"
          color="secondary.500"
          minW={{ base: '1.75rem', xs: '2.75rem', sm: '2.75rem' }}
          {...getForwardProps({ calendars })}
        />
      </Flex>
    </Flex>
  )
}
