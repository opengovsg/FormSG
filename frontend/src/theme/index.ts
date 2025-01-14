import { extendTheme } from '@chakra-ui/react'

import { BREAKPOINT_VALS } from './foundations/breakpoints'
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
    },
  },
  colors: colours,
  textStyles,
  breakpoints: BREAKPOINT_VALS,
  shadows,
  fonts: {
    heading: `'Inter var', sans-serif`,
    body: `'Inter var', sans-serif`,
  },
  components,
})
