import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { FormColorTheme, FormStartPage } from '~shared/types'

import { useDesignColorTheme } from '~features/admin-form/create/builder-and-design/utils/useDesignColorTheme'

interface UseFormHeaderProps {
  startPage?: FormStartPage
  hover?: boolean
}

export const getTitleBg = (colorTheme?: FormColorTheme, hover?: boolean) =>
  colorTheme ? `theme-${colorTheme}.${hover ? 6 : 5}00` : `neutral.200`

export const useFormHeader = ({ startPage, hover }: UseFormHeaderProps) => {
  const { t } = useTranslation()
  const colorScheme = useDesignColorTheme()
  const titleColor = useMemo(() => {
    if (colorScheme === FormColorTheme.Orange) {
      return 'secondary.700'
    }
    return 'white'
  }, [colorScheme])

  const titleBg = useMemo(
    () => getTitleBg(colorScheme, hover),
    [hover, colorScheme],
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
