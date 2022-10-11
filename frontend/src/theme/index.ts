import { extendTheme } from '@chakra-ui/react'

import { breakpoints } from './foundations/breakpoints'
import { colours } from './foundations/colours'
import { shadows } from './foundations/shadows'
import { components } from './components'
import { textStyles } from './textStyles'

export const theme = extendTheme({
  styles: {
    global: {
      '*': {
        margin: 0,
      },
      html: {
        height: '100%',
      },
      'th, td': {
        padding: 0,
      },
      body: {
        height: '100%',
        fontFeatureSettings: "'tnum' on, 'cv05' on",
        WebkitFontSmoothing: 'antialiased',
      },
      '#root, #__next': {
        isolation: 'isolate',
        height: 'inherit',
      },
      /**
       * This will hide the focus indicator if the element receives focus via
       * the mouse,but it will still show up on keyboard focus.
       * Part of the steps needed to get focus-visible working.
       * See https://www.npmjs.com/package/focus-visible#2-update-your-css.
       */
      '.js-focus-visible :focus:not([data-focus-visible-added])': {
        outline: 'none',
      },
      '.focus-visible': { outline: 'none' },
    },
  },
  colors: colours,
  textStyles,
  breakpoints,
  shadows,
  fonts: {
    heading: `'Inter var', sans-serif`,
    body: `'Inter var', sans-serif`,
  },
  components,
})
