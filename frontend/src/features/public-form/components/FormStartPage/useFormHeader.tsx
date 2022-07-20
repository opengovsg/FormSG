import simplur from 'simplur'

import { FormColorTheme, FormStartPage } from '~shared/types'

export const getTitleBg = (colorTheme?: FormColorTheme) =>
  colorTheme ? `theme-${colorTheme}.500` : `neutral.200`

export const getFormHeaderDesignProps = (startPage?: FormStartPage) => {
  const titleColor =
    startPage?.colorTheme === FormColorTheme.Orange ? 'secondary.700' : 'white'

  const titleBg = getTitleBg(startPage?.colorTheme)

  const estTimeString = !startPage?.estTimeTaken
    ? ''
    : simplur`${startPage.estTimeTaken} min[|s] estimated time to complete`

  return { titleColor, titleBg, estTimeString }
}
