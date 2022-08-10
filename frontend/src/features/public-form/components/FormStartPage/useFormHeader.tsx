import { useMemo } from 'react'
import simplur from 'simplur'

import { FormColorTheme, FormStartPage } from '~shared/types'

import { ThemeColorScheme } from '~theme/foundations/colours'

interface UseFormHeaderProps {
  startPage?: FormStartPage
  hover?: boolean
}

export const getTitleBg = (colorTheme?: FormColorTheme, hover?: boolean) =>
  colorTheme ? `theme-${colorTheme}.${hover ? 6 : 5}00` : `neutral.200`

export const useFormHeader = ({ startPage, hover }: UseFormHeaderProps) => {
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
    if (!startPage?.estTimeTaken) return ''
    return simplur`${startPage.estTimeTaken} min[|s] estimated time to complete`
  }, [startPage])

  const colorScheme: ThemeColorScheme | undefined = useMemo(() => {
    if (!startPage?.colorTheme) return
    return `theme-${startPage.colorTheme}` as const
  }, [startPage?.colorTheme])

  return {
    titleColor,
    titleBg,
    estTimeString,
    colorScheme,
  }
}
