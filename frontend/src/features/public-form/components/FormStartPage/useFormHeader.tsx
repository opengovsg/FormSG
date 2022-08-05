import { useMemo } from 'react'
import simplur from 'simplur'

import { FormColorTheme, FormStartPage } from '~shared/types'

import { ThemeColorScheme } from '~theme/foundations/colours'

export const getTitleBg = (colorTheme?: FormColorTheme) =>
  colorTheme ? `theme-${colorTheme}.500` : `neutral.200`

export const useFormHeader = (startPage?: FormStartPage) => {
  const titleColor = useMemo(() => {
    if (startPage?.colorTheme === FormColorTheme.Orange) {
      return 'secondary.700'
    }
    return 'white'
  }, [startPage?.colorTheme])

  const titleBg = useMemo(
    () => getTitleBg(startPage?.colorTheme),
    [startPage?.colorTheme],
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
