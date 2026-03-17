import { Calendar } from '~components/Calendar'

import { useDatePicker } from '../DatePickerContext'

export const DatePickerCalendar = (): JSX.Element => {
  const {
    colorScheme,
    internalValue,
    isDateUnavailable,
    handleDateChange,
    initialFocusRef,
    monthsToDisplay,
  } = useDatePicker()
  return (
    <Calendar
      monthsToDisplay={monthsToDisplay}
      colorScheme={colorScheme}
      value={internalValue ?? undefined}
      isDateUnavailable={isDateUnavailable}
      onChange={handleDateChange}
      ref={initialFocusRef}
    />
  )
}
