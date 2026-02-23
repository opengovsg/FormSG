import { useMemo } from 'react'

import { ThemeColorScheme } from '~theme/foundations/colours'

import { useDesignColorTheme } from './useDesignColorTheme'

export const useDesignColorScheme = (): ThemeColorScheme | undefined => {
  const colorTheme = useDesignColorTheme()
  return useMemo(
    () => (colorTheme ? (`theme-${colorTheme}` as const) : undefined),
    [colorTheme],
  )
}
