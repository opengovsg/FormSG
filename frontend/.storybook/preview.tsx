import 'focus-visible/dist/focus-visible'
import '../src/index.css'

import { ChakraProvider } from '@chakra-ui/react'
import { DecoratorFn } from '@storybook/react'
import { withPerformance } from 'storybook-addon-performance'

import { theme } from '../src/theme'

const withChakra: DecoratorFn = (storyFn) => (
  <ChakraProvider resetCSS theme={theme}>
    {storyFn()}
  </ChakraProvider>
)

export const decorators = [withChakra, withPerformance]
