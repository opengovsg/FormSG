import 'focus-visible/dist/focus-visible'
import '../src/assets/fonts/inter.css'

import { ChakraProvider } from '@chakra-ui/react'
import { DecoratorFn } from '@storybook/react'

import { theme } from '../src/theme'

const withChakra: DecoratorFn = (storyFn) => (
  <ChakraProvider resetCSS theme={theme}>
    {storyFn()}
  </ChakraProvider>
)

export const decorators = [withChakra]
