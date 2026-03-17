import { useMemo } from 'react'

import { ThemeColorScheme } from '~theme/foundations/colours'

import { useFormColorTheme } from './useFormColorTheme'

export const useFormColorScheme = (): ThemeColorScheme | undefined => {
  const colorTheme = useFormColorTheme()
  return useMemo(
    () => (colorTheme ? (`theme-${colorTheme}` as const) : undefined),
    [colorTheme],
  )
}
