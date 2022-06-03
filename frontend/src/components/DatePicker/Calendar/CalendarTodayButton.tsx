import { Box, useStyles } from '@chakra-ui/react'

import Button from '~components/Button'

import { useCalendar } from './CalendarContext'

export const CalendarTodayButton = (): JSX.Element => {
  const styles = useStyles()
  const { handleTodayClick, colorScheme } = useCalendar()
  return (
    <Box sx={styles.todayLinkContainer}>
      <Button
        aria-label="Focus on today's date"
        colorScheme={colorScheme}
        variant="link"
        type="button"
        onClick={handleTodayClick}
      >
        Today
      </Button>
    </Box>
  )
}
