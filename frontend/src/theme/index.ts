import { extendTheme } from '@chakra-ui/react'

import { colours } from './foundations/colours'
import { shadows } from './foundations/shadows'
import { components } from './components'
import { textStyles } from './textStyles'

export const theme = extendTheme({
  colors: colours,
  textStyles,
  shadows,
  fonts: {
    body: 'Inter',
  },
  components,
})
