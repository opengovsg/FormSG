import { extendTheme } from '@chakra-ui/react'
import { theme as baseTheme } from '@opengovsg/design-system-react'

import { YesNoField } from './components/Field/YesNo'
import { Tabs } from './components/Tabs'
import { BREAKPOINT_VALS } from './foundations/breakpoints'
import { shadows } from './foundations/shadows'
import { spacing } from './foundations/spacing'
import { typography } from './foundations/typography'
import { colors } from './colors'
import { textStyles } from './textStyles'

export const theme = extendTheme(baseTheme, {
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
  colors,
  shadows,
  space: spacing,
  fontSizes: typography.fontSize,
  fontWeights: typography.fontWeights,
  lineHeights: typography.lineHeights,
  letterSpacings: typography.letterSpacing,
  textStyles,
  breakpoints: BREAKPOINT_VALS,
  components: {
    YesNoField,
    Tabs,
  },
})
