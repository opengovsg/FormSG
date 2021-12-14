import { Box, useStyles } from '@chakra-ui/react'

import Link from '~components/Link'

import { useCalendar } from './CalendarContext'

export const CalendarTodayButton = (): JSX.Element => {
  const styles = useStyles()
  const { handleTodayClick } = useCalendar()
  return (
    <Box sx={styles.todayLinkContainer}>
      <Link onClick={handleTodayClick} role="button" tabIndex={0}>
        Today
      </Link>
    </Box>
  )
}
