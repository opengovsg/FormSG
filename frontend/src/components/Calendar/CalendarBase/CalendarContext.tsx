import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import {
  addMonths,
  differenceInCalendarMonths,
  isFirstDayOfMonth,
  isSameDay,
} from 'date-fns'
import { Props as DayzedProps, RenderProps, useDayzed } from 'dayzed'
import { inRange } from 'lodash'
import { useKey } from 'rooks'

import { ThemeColorScheme } from '~theme/foundations/colours'

import { CalendarProps } from '../Calendar'

import { DateRangeValue } from './types'
import {
  generateClassNameForDate,
  generateValidUuidClass,
  getDateFromClassName,
  getMonthOffsetFromToday,
  getNewDateFromKeyPress,
  getYearOptions,
} from './utils'

const ARROW_KEY_NAMES = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

type PassthroughProps = {
  /**
   * Function to be passed to CalendarPanel to determine range styling.
   * Used for multi-calendar variant.
   */
  isDateInRange?: (d: Date) => boolean
  /**
   * Function to be passed to CalendarPanel to determine range styling.
   * Called when a date is selected and a mouseover is detected over a date.
   * Used for multi-calendar variant.
   */
  onMouseEnterHighlight?: (date: Date) => void
  /**
   * Function to be passed to CalendarPanel to determine range styling.
   * Called when mouse leaves the calendar.
   * Used for multi-calendar variant.
   */
  onMouseLeaveCalendar?: () => void
  /**
   * The dates that are selected.
   */
  selectedDates?: Date | DateRangeValue
  /**
   * Handler for when date is selected.
   */
  onSelectDate: (d: Date) => void
  /**
   * Function to determine whether a date should be made
   * unavailable.
   */
  isDateUnavailable?: (d: Date) => boolean
  /**
   * Date currently being hovered, if any.
   */
  hoveredDate?: Date
  /**
   * Color scheme of date input
   */
  colorScheme?: ThemeColorScheme
}
export type UseProvideCalendarProps = Pick<DayzedProps, 'monthsToDisplay'> &
  PassthroughProps

interface CalendarContextProps extends CalendarProps, PassthroughProps {
  uuid: string
  currMonth: number
  currYear: number
  setCurrMonth: Dispatch<SetStateAction<number>>
  setCurrYear: Dispatch<SetStateAction<number>>
  renderProps: RenderProps
  yearOptions: number[]
  isDateFocusable: (d: Date) => boolean
  handleTodayClick: () => void
  dateToFocus: Date
  selectedDates?: Date | DateRangeValue
  monthsToDisplay: Required<CalendarProps>['monthsToDisplay']
}

const CalendarContext = createContext<CalendarContextProps | undefined>(
  undefined,
)

interface CalendarProviderProps extends UseProvideCalendarProps {
  children: React.ReactNode
}

export const CalendarProvider = ({
  children,
  ...props
}: CalendarProviderProps) => {
  const value = useProvideCalendar(props)

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  )
}

export const useCalendar = (): CalendarContextProps => {
  const context = useContext(CalendarContext)

  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }

  return context
}

const useProvideCalendar = ({
  selectedDates,
  onSelectDate,
  isDateUnavailable,
  monthsToDisplay = 1,
  onMouseEnterHighlight,
  onMouseLeaveCalendar,
  isDateInRange,
  hoveredDate,
  colorScheme = 'primary',
}: UseProvideCalendarProps) => {
  // Ensure that calculations are always made based on date of initial render,
  // so component state doesn't suddenly jump at midnight
  const today = useMemo(() => new Date(), [])
  // Unique className for dates
  const uuid = useMemo(() => generateValidUuidClass(), [])
  const yearOptions = useMemo(() => getYearOptions(), [])

  // Date to focus on initial render if initialFocusRef is passed
  const dateToFocus = useMemo(() => {
    if (Array.isArray(selectedDates)) {
      return selectedDates[0] ?? today
    }
    return selectedDates ?? today
  }, [today, selectedDates])
  const [currMonth, setCurrMonth] = useState<number>(dateToFocus.getMonth())
  const [currYear, setCurrYear] = useState<number>(dateToFocus.getFullYear())

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

  const updateMonthYear = useCallback(
    (newDate: Date) => {
      const monthDiff = differenceInCalendarMonths(
        newDate,
        new Date(currYear, currMonth),
      )
      if (monthDiff < 0 || monthDiff > monthsToDisplay - 1) {
        setCurrMonth(newDate.getMonth())
        setCurrYear(newDate.getFullYear())
      }
    },
    [currMonth, currYear, monthsToDisplay],
  )

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
      const focusedDate = getDateFromClassName(currentlyFocused.className, uuid)
      if (!focusedDate) return
      // Prevent arrow key from scrolling screen
      e.preventDefault()
      const newDate = getNewDateFromKeyPress(focusedDate, e.key)
      if (newDate === focusedDate) return
      // If newDate is outside current displayed months, scroll to that month
      updateMonthYear(newDate)

      const elementToFocus = document.querySelector(
        `.${generateClassNameForDate(uuid, newDate)}`,
      ) as HTMLButtonElement | null
      elementToFocus?.focus()
    },
    [updateMonthYear, uuid],
  )
  useKey(ARROW_KEY_NAMES, handleArrowKey)

  const handleDateSelected = useCallback(
    (d: Date) => {
      if (isDateUnavailable?.(d)) return
      // Set current month/year to that of selected
      updateMonthYear(d)
      // Call parent callback
      onSelectDate?.(d)
    },
    [isDateUnavailable, onSelectDate, updateMonthYear],
  )

  const renderProps = useDayzed({
    date: today,
    onDateSelected: ({ date }) => handleDateSelected(date),
    showOutsideDays: monthsToDisplay === 1,
    offset: getMonthOffsetFromToday(today, currMonth, currYear),
    onOffsetChanged,
    selected: !Array.isArray(selectedDates)
      ? selectedDates
      : (selectedDates.filter(Boolean) as Date[]),
    monthsToDisplay: monthsToDisplay,
  })

  /**
   * Determines whether a given date should be in the tabbing sequence.
   * We only want one date at a time to be in the tabbing sequence.
   */
  const isDateFocusable = useCallback(
    (d: Date) => {
      // If there is a selected date in the current month, make it
      // the only focusable date
      if (
        dateToFocus &&
        inRange(dateToFocus.getMonth(), currMonth, currMonth + monthsToDisplay)
      ) {
        return isSameDay(d, dateToFocus)
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
    [dateToFocus, currMonth, monthsToDisplay],
  )

  return {
    uuid,
    currMonth,
    currYear,
    setCurrMonth,
    setCurrYear,
    renderProps,
    yearOptions,
    isDateUnavailable,
    selectedDates,
    onSelectDate,
    isDateFocusable,
    handleTodayClick,
    dateToFocus,
    onMouseEnterHighlight,
    onMouseLeaveCalendar,
    isDateInRange,
    hoveredDate,
    colorScheme,
    monthsToDisplay,
  }
}
