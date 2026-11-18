import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatInTimeZone } from 'date-fns-tz'

import { DateString, FormColorTheme, FormStartPage } from 'formsg-shared/types'

import { ThemeColorScheme } from '~theme/foundations/colours'

// Deadlines are always Singapore time, and the respondent may not be.
const SGT = 'Asia/Singapore'

interface UseFormHeaderProps {
  startPage?: FormStartPage
  closeAt?: DateString | null
  hover?: boolean
}

export const getTitleBg = (colorTheme?: FormColorTheme, hover?: boolean) =>
  colorTheme ? `theme-${colorTheme}.${hover ? 6 : 5}00` : `neutral.200`

export const useFormHeader = ({
  startPage,
  closeAt,
  hover,
}: UseFormHeaderProps) => {
  const { t } = useTranslation()
  const titleColor = useMemo(() => {
    if (startPage?.colorTheme === FormColorTheme.Orange) {
      return 'secondary.700'
    }
    return 'white'
  }, [startPage?.colorTheme])

  const titleBg = useMemo(
    () => getTitleBg(startPage?.colorTheme, hover),
    [hover, startPage?.colorTheme],
  )

  const estTimeString = useMemo(() => {
    return startPage?.estTimeTaken
      ? t('features.publicForm.components.header.estTime', {
          estTime: startPage.estTimeTaken,
        })
      : ''
  }, [t, startPage?.estTimeTaken])

  const closeAtString = useMemo(() => {
    if (!closeAt) return ''
    const closeAtDate = new Date(closeAt)
    // Only reachable in a tab left open across the deadline.
    if (closeAtDate <= new Date()) return ''
    return t('features.publicForm.components.header.closeAt', {
      closeAt: formatInTimeZone(closeAtDate, SGT, "d MMM yyyy, h:mm a '(SGT)'"),
    })
  }, [t, closeAt])

  const colorScheme: ThemeColorScheme | undefined = useMemo(() => {
    if (!startPage?.colorTheme) return
    return `theme-${startPage.colorTheme}` as const
  }, [startPage?.colorTheme])

  return {
    titleColor,
    titleBg,
    estTimeString,
    closeAtString,
    colorScheme,
  }
}
