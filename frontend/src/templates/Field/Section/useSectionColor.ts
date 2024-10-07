import { useMemo } from 'react'

import { FormColorTheme } from '~shared/types'

export const useSectionColor = (colorTheme?: FormColorTheme) => {
  const sectionColor = useMemo(() => {
    switch (colorTheme) {
      case FormColorTheme.Orange:
      case FormColorTheme.Red:
        return `theme-${colorTheme}.600` as const
      default:
        return `theme-${colorTheme}.500` as const
    }
  }, [colorTheme])

  return sectionColor
}
