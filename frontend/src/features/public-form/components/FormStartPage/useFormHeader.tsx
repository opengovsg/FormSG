import { useMemo } from 'react'
import simplur from 'simplur'

import { FormColorTheme, FormStartPage } from '~shared/types'

export const useFormHeader = (startPage: FormStartPage | undefined) => {
  const titleColor = useMemo(() => {
    if (startPage?.colorTheme === FormColorTheme.Orange) {
      return 'secondary.700'
    }
    return 'white'
  }, [startPage?.colorTheme])

  const titleBg = useMemo(
    () =>
      startPage?.colorTheme
        ? `theme-${startPage.colorTheme}.500`
        : `neutral.200`,
    [startPage?.colorTheme],
  )

  const estTimeString = useMemo(() => {
    if (!startPage?.estTimeTaken) return ''
    return simplur`${startPage.estTimeTaken} min[|s] estimated time to complete`
  }, [startPage])

  return { titleColor, titleBg, estTimeString }
}
