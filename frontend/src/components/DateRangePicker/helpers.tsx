import { format, isValid } from 'date-fns'

import { DateString } from '~shared/types'

import { DateRangeValue } from '~components/Calendar'

export const dateStringToDatePickerValue = (range: DateString[]) => {
  const [start, end] = range
  // Convert to Date objects
  const startDate = new Date(start)
  const endDate = new Date(end)
  const result: (Date | null)[] = [null, null]
  // Check if dates are valid
  if (isValid(startDate)) {
    result[0] = startDate
  }
  if (isValid(endDate)) {
    result[1] = endDate
  }
  return result as DateRangeValue
}

export const datePickerValueToDateString = (range: DateRangeValue) => {
  const [start, end] = range
  const result: DateString[] = []
  if (start) {
    result.push(format(start, 'yyyy-MM-dd') as DateString)
  }
  if (end) {
    result.push(format(end, 'yyyy-MM-dd') as DateString)
  }
  return result
}
