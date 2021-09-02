import 'focus-visible/dist/focus-visible.min.js'
import '../src/assets/fonts/inter.css'

import { QueryClient, QueryClientProvider } from 'react-query'
import { ChakraProvider } from '@chakra-ui/react'
import { DecoratorFn } from '@storybook/react'

import { theme } from '../src/theme'

import { StorybookTheme } from './themes'

const withReactQuery: DecoratorFn = (storyFn) => {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>{storyFn()}</QueryClientProvider>
  )
}

const withChakra: DecoratorFn = (storyFn) => (
  <ChakraProvider resetCSS theme={theme}>
    {storyFn()}
  </ChakraProvider>
)

export const decorators = [withReactQuery, withChakra]

export const parameters = {
  docs: {
    theme: StorybookTheme.docs,
    inlineStories: true,
  },
}
