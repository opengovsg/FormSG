import 'focus-visible/dist/focus-visible'
import '../src/index.css'

import { ChakraProvider } from '@chakra-ui/react'

import { theme } from '../src/theme'

const withChakra = (storyFn: Function) => (
  <ChakraProvider resetCSS theme={theme}>
    {storyFn()}
  </ChakraProvider>
)

export const decorators = [withChakra]
