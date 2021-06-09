import { extendTheme } from '@chakra-ui/react'

import { colours } from './foundations/colours'
import { components } from './components'
import { textStyles } from './textStyles'

export const theme = extendTheme({
  colors: colours,
  textStyles,
  fonts: {
    body: 'Inter',
  },
  components,
})
