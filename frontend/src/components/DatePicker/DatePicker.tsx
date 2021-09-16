import { useCallback, useMemo, useState } from 'react'
import { useKey } from 'react-use'
import {
  Box,
  Flex,
  forwardRef,
  Select,
  SimpleGrid,
  useBreakpointValue,
  useMultiStyleConfig,
} from '@chakra-ui/react'
import { addMonths, isFirstDayOfMonth, isSameDay, isToday } from 'date-fns'
import { useDayzed } from 'dayzed'

import { BxChevronLeft, BxChevronRight } from '~assets/icons'
import { DATE_INPUT_THEME_KEY } from '~theme/components/DateInput'
import IconButton from '~components/IconButton'
import Link from '~components/Link'

import { DayOfMonth } from './DayOfMonth'
import {
  DAY_NAMES,
  generateClassNameForDate,
  generateValidUuidClass,
  getDateFromClassName,
  getMonthOffsetFromToday,
  getNewDateFromKeyPress,
  getYearOptions,
  MONTH_NAMES,
} from './utils'

export interface DatePickerProps {
  /**
   * Initially selected date.
   */
  selected?: Date
  /**
   * Handler for when date is selected.
   */
  onDateSelected?: (d: Date) => void
  /**
   * Function to determine whether a date should be made
   * unavailable.
   */
  isDateUnavailable?: (d: Date) => boolean
}

const ARROW_KEY_NAMES = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

export const DatePicker = forwardRef<DatePickerProps, 'input'>(
  (
    { selected: initiallySelected, onDateSelected, isDateUnavailable },
    initialFocusRef,
  ) => {
    // Ensure that calculations are always made based on date of initial render,
    // so component state doesn't suddenly jump at midnight
    const today = useMemo(() => new Date(), [])
    // Unique className for dates
    const uuid = useMemo(() => generateValidUuidClass(), [])
    const yearOptions = useMemo(() => getYearOptions(), [])

    const [selected, setSelected] = useState<Date | undefined>(
      initiallySelected,
    )
    // Date to focus on initial render if initialFocusRef is passed
    const dateToFocus = useMemo(() => selected ?? today, [today, selected])
    const [currMonth, setCurrMonth] = useState<number>(today.getMonth())
    const [currYear, setCurrYear] = useState<number>(today.getFullYear())

    /**
     * Whether the full name of the month should be used in the dropdown
     */
    const shouldUseMonthFullName = useBreakpointValue({
      base: false,
      md: true,
    })

    /**
     * Updates the current year and month when the forward/back arrows are clicked.
     * We need to pass this to Dayzed because we want to control the current year
     * and month via both the dropdowns and arrows.
     */
    const onOffsetChanged = useCallback(
      (offset: number) => {
        const newDate = addMonths(today, offset)
        setCurrYear(newDate.getFullYear())
        setCurrMonth(newDate.getMonth())
      },
      [today],
    )

    /**
     * Handles user clicking on "Today" at bottom of datepicker
     */
    const handleTodayClick = useCallback(() => {
      // Get most updated "today", rather than "today" at the point
      // of component rendering
      const today = new Date()
      setCurrMonth(today.getMonth())
      setCurrYear(today.getFullYear())
      // Workaround to ensure that the correct element is in the DOM
      // before running document.querySelector
      setTimeout(() => {
        const elementToFocus = document.querySelector(
          `.${generateClassNameForDate(uuid, today)}`,
        ) as HTMLButtonElement | null
        elementToFocus?.focus()
        // Workaround because for some reason the attributes do not
        // get added automatically
        elementToFocus?.classList.add('focus-visible')
        elementToFocus?.setAttribute('data-focus-visible-added', 'true')
      })
    }, [uuid])

    /**
     * Allows user to change focus across rows/columns using arrow keys. The
     * idea is to attach a unique classname to each day, from which we can derive
     * the date which it corresponds to.
     * This function implements an effect where using the arrow key to move
     * to dates outside the current month (i.e. the greyed-out dates from the previous
     * and next months) will cause the datepicker to scroll to that month. However,
     * note that we DO NOT want this effect to happen for tabs too, as this would mean
     * the user can never tab outside the datepicker.
     */
    const handleArrowKey = useCallback(
      (e: KeyboardEvent) => {
        const currentlyFocused = document.activeElement
        if (!currentlyFocused || !currentlyFocused.className.includes(uuid)) {
          return
        }
        const focusedDate = getDateFromClassName(
          currentlyFocused.className,
          uuid,
        )
        if (!focusedDate) return
        // Prevent arrow key from scrolling screen
        e.preventDefault()
        const newDate = getNewDateFromKeyPress(focusedDate, e.key)
        // If newDate is outside current month, scroll to that month
        setCurrMonth(newDate.getMonth())
        setCurrYear(newDate.getFullYear())
        const elementToFocus = document.querySelector(
          `.${generateClassNameForDate(uuid, newDate)}`,
        ) as HTMLButtonElement | null
        elementToFocus?.focus()
      },
      [uuid],
    )
    useKey((e) => ARROW_KEY_NAMES.includes(e.key), handleArrowKey)

    const handleDateSelected = useCallback(
      (d: Date) => {
        setSelected(d)
        // Set current month/year to that of selected
        setCurrMonth(d.getMonth())
        setCurrYear(d.getFullYear())
        // Call parent callback
        onDateSelected?.(d)
      },
      [onDateSelected],
    )

    const { calendars, getForwardProps, getBackProps, getDateProps } =
      useDayzed({
        date: today,
        onDateSelected: ({ date }) => handleDateSelected(date),
        showOutsideDays: true,
        offset: getMonthOffsetFromToday(today, currMonth, currYear),
        onOffsetChanged,
        selected,
      })

    /**
     * Determines whether a given date should be in the tabbing sequence.
     * We only want one date at a time to be in the tabbing sequence.
     */
    const isDateFocusable = useCallback(
      (d: Date) => {
        // If there is a selected date in the current month, make it
        // the only focusable date
        if (selected && selected.getMonth() === currMonth) {
          return isSameDay(d, selected)
        }
        // If today is in the current month, make it the only focusable date
        // Use the latest today instead of memoised today since this doesn't affect
        // offset logic
        const currentToday = new Date()
        if (currentToday.getMonth() === currMonth) {
          return isSameDay(d, currentToday)
        }
        // If current month does not contain selected or today, make
        // first day focusable. We need to check that it corresponds with
        // currMonth or the spillover dates for the next month will be included.
        return d.getMonth() === currMonth && isFirstDayOfMonth(d)
      },
      [selected, currMonth],
    )

    const styles = useMultiStyleConfig(DATE_INPUT_THEME_KEY, {})

    return (
      // Overall container
      <Box __css={styles.container}>
        {/* Month, year selectors */}
        <Flex __css={styles.monthYearSelectorContainer}>
          <Flex __css={styles.monthYearDropdownContainer}>
            <Select
              value={currMonth}
              onChange={(e) => setCurrMonth(Number(e.target.value))}
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
              onChange={(e) => setCurrYear(Number(e.target.value))}
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
        {/* Calendars is an array, but it should only have 1 element since
      we only render 1 month at a time */}
        <Box __css={styles.calendarContainer}>
          {calendars.map((calendar) => (
            <Box key={`${calendar.month}${calendar.year}`}>
              <SimpleGrid columns={DAY_NAMES.length} sx={styles.monthGrid}>
                {DAY_NAMES.map((dayName, index) => (
                  <Box key={index} __css={styles.dayNamesContainer}>
                    {dayName}
                  </Box>
                ))}
                {calendar.weeks.map((week, windex) =>
                  week.map((dateObj, index) => {
                    if (!dateObj) {
                      return null
                    }
                    const { date, selected } = dateObj
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
                        isToday={isToday(date)}
                        isOutsideCurrMonth={currMonth !== date.getMonth()}
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
            </Box>
          ))}
        </Box>
        <Box __css={styles.todayLinkContainer}>
          <Link onClick={handleTodayClick} role="button" tabIndex={0}>
            Today
          </Link>
        </Box>
      </Box>
    )
  },
)
