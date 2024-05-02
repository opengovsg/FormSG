import { UseProvideCalendarProps } from './CalendarContext'

export type CalendarBaseProps = Pick<
  UseProvideCalendarProps,
  'colorScheme' | 'isDateUnavailable' | 'monthsToDisplay' | 'size'
>

export type DateRangeValue = [null, null] | [Date, null] | [Date, Date]
