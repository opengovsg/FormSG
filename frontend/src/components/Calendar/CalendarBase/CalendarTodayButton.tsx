import { useTranslation } from 'react-i18next'
import { Box } from '@chakra-ui/react'

import Button from '~components/Button'

import { useCalendar } from './CalendarContext'
import { useCalendarStyles } from './CalendarStyleProvider'

export const CalendarTodayButton = (): JSX.Element => {
  const styles = useCalendarStyles()
  const { handleTodayClick, colorScheme } = useCalendar()
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.publicForm.components.fields.calendar',
  })

  return (
    <Box sx={styles.todayLinkContainer}>
      <Button
        aria-label={t('todayAriaLabel')}
        colorScheme={colorScheme}
        variant="link"
        type="button"
        onClick={handleTodayClick}
      >
        {t('today')}
      </Button>
    </Box>
  )
}
