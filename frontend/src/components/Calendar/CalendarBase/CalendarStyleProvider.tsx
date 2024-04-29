import { createStylesContext } from '@chakra-ui/react'

const [CalendarStylesProvider, useCalendarStyles] =
  createStylesContext('Calendar')

export { CalendarStylesProvider, useCalendarStyles }
