import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { FormColorTheme, FormStartPage } from '~shared/types'

import { useFormColorTheme } from '~features/public-form/utils/useFormColorTheme'

import { useFormColorScheme } from '../../utils/useFormColorScheme'

interface UseFormHeaderProps {
  startPage?: FormStartPage
  hover?: boolean
}

export const getTitleBg = (colorTheme?: FormColorTheme, hover?: boolean) =>
  colorTheme ? `theme-${colorTheme}.${hover ? 6 : 5}00` : `neutral.200`

export const useFormHeader = ({ startPage, hover }: UseFormHeaderProps) => {
  const { t } = useTranslation()
  const colorTheme = useFormColorTheme()
  const colorScheme = useFormColorScheme()
  const titleColor = useMemo(() => {
    if (colorTheme === FormColorTheme.Orange) {
      return 'secondary.700'
    }
    return 'white'
  }, [colorTheme])

  const titleBg = useMemo(
    () => getTitleBg(colorTheme, hover),
    [hover, colorTheme],
  )

  const estTimeString = useMemo(() => {
    return startPage?.estTimeTaken
      ? t('features.publicForm.components.header.estTime', {
          estTime: startPage.estTimeTaken,
        })
      : ''
  }, [t, startPage?.estTimeTaken])

  return {
    titleColor,
    titleBg,
    estTimeString,
    colorScheme,
  }
}
