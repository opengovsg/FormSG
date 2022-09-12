import { UseProvideCalendarProps } from './CalendarContext'

export type CalendarBaseProps = Pick<
  UseProvideCalendarProps,
  'colorScheme' | 'isDateUnavailable' | 'monthsToDisplay'
>
