import { format, isValid } from 'date-fns'

import { DateString } from '~shared/types'

import { DateRangeValue } from '~components/Calendar'

export const dateStringToDatePickerValue = (
  range: [DateString | null, DateString | null],
): DateRangeValue => {
  const [start, end] = range
  if (!start && !end) {
    return [null, null]
  }
  // Convert to Date objects
  const startDate = start && isValid(new Date(start)) ? new Date(start) : null
  const endDate = end && isValid(new Date(end)) ? new Date(end) : null

  return [startDate, endDate] as DateRangeValue
}

export const datePickerValueToDateString = (
  range: DateRangeValue,
): [DateString | null, DateString | null] => {
  const [start, end] = range

  if (!start && !end) {
    return [null, null]
  }

  const startDateString = start
    ? (format(start, 'yyyy-MM-dd') as DateString)
    : null
  const endDateString = end ? (format(end, 'yyyy-MM-dd') as DateString) : null
  return [startDateString, endDateString]
}
