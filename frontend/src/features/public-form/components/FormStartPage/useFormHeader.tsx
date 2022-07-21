import { useMemo } from 'react'
import simplur from 'simplur'

import { FormColorTheme, FormStartPage } from '~shared/types'

export const getTitleBg = (colorTheme?: FormColorTheme) =>
  colorTheme ? `theme-${colorTheme}.500` : `neutral.200`

export const useFormHeader = (startPage?: FormStartPage) => {
  const titleColor = useMemo(
    () =>
      startPage?.colorTheme === FormColorTheme.Orange
        ? 'secondary.700'
        : 'white',
    [startPage?.colorTheme],
  )

  const titleBg = useMemo(
    () => getTitleBg(startPage?.colorTheme),
    [startPage?.colorTheme],
  )

  const estTimeString = useMemo(
    () =>
      !startPage?.estTimeTaken
        ? ''
        : simplur`${startPage.estTimeTaken} min[|s] estimated time to complete`,
    [startPage?.estTimeTaken],
  )

  return { titleColor, titleBg, estTimeString }
}
