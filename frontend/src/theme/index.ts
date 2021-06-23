import { extendTheme } from '@chakra-ui/react'

import { colours } from './foundations/colours'
import { shadows } from './foundations/shadows'
import { components } from './components'
import { textStyles } from './textStyles'

export const theme = extendTheme({
  styles: {
    global: {
      body: {
        fontFeatureSettings: "'tnum' on, 'cv05' on",
      },
    },
  },
  colors: colours,
  textStyles,
  shadows,
  fonts: {
    heading: 'Inter,Helvetica,Arial,system-ui,sans-serif',
    body: 'Inter,Helvetica,Arial,system-ui,sans-serif',
  },
  components,
})
