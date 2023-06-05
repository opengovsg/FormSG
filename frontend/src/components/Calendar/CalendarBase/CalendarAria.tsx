import { memo, useMemo } from 'react'
import { VisuallyHidden } from '@chakra-ui/react'

import { useCalendar } from './CalendarContext'
import { MONTH_NAMES } from './utils'

export const CalendarAria = memo(() => {
  const { monthsToDisplay, currMonth, currYear, selectedDates } = useCalendar()

  const displayedMonthsAriaLiveText = useMemo(() => {
    const endMonthNum = (currMonth + monthsToDisplay - 1) % 12
    const startMonth = MONTH_NAMES[currMonth].fullName
    const endMonth = MONTH_NAMES[endMonthNum].fullName
    if (startMonth === endMonth) {
      return `Currently displaying ${MONTH_NAMES[currMonth].fullName} ${currYear}`
    }
    if (endMonthNum < currMonth) {
      return `Currently displaying ${startMonth} ${currYear} to ${endMonth} ${
        currYear + 1
      }`
    }
    return `Currently displaying ${startMonth} ${currYear} to ${endMonth} ${currYear}`
  }, [currMonth, currYear, monthsToDisplay])

  const selectedDatesAriaLiveText = useMemo(() => {
    if (!selectedDates) {
      return 'No date selected'
    }
    if (selectedDates instanceof Date) {
      return `Selected date: ${selectedDates.toLocaleDateString()}`
    }

    // Date range values handling
    const [startDate, endDate] = selectedDates
    if (!startDate && !endDate) {
      return 'No date selected'
    }
    if (startDate && !endDate) {
      return `Selected date: ${startDate.toLocaleDateString()}`
    }

    return `Selected date range: ${startDate?.toLocaleDateString()} to ${endDate?.toLocaleDateString()}`
  }, [selectedDates])

  return (
    <>
      <VisuallyHidden aria-live="polite" aria-atomic>
        {displayedMonthsAriaLiveText}
      </VisuallyHidden>
      <VisuallyHidden aria-live="polite" aria-atomic>
        {selectedDatesAriaLiveText}
      </VisuallyHidden>
    </>
  )
})
