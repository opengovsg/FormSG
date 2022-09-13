import { RangeCalendar } from '~components/Calendar'

import { useDateRangePicker } from '../DateRangePickerContext'

export const DateRangePickerCalendar = (): JSX.Element => {
  const {
    colorScheme,
    internalValue,
    isDateUnavailable,
    handleCalendarDateChange,
    initialFocusRef,
  } = useDateRangePicker()

  return (
    <RangeCalendar
      colorScheme={colorScheme}
      value={internalValue ?? undefined}
      isDateUnavailable={isDateUnavailable}
      onChange={handleCalendarDateChange}
      ref={initialFocusRef}
    />
  )
}
