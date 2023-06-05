import { UseProvideCalendarProps } from './CalendarContext'

export type CalendarBaseProps = Pick<
  UseProvideCalendarProps,
  'colorScheme' | 'isDateUnavailable' | 'monthsToDisplay'
>

export type DateRangeValue = [null, null] | [Date, null] | [Date, Date]
