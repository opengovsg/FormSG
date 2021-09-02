import 'focus-visible/dist/focus-visible.min.js'
import '../src/assets/fonts/inter.css'

import { QueryClient, QueryClientProvider } from 'react-query'
import { ChakraProvider } from '@chakra-ui/react'
import { DecoratorFn } from '@storybook/react'
import { initialize, mswDecorator } from 'msw-storybook-addon'

import { AuthProvider } from '~contexts/AuthContext'

import { theme } from '../src/theme'

import { StorybookTheme } from './themes'

initialize()

const withReactQuery: DecoratorFn = (storyFn) => {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{storyFn()}</AuthProvider>
    </QueryClientProvider>
  )
}

const withChakra: DecoratorFn = (storyFn) => (
  <ChakraProvider resetCSS theme={theme}>
    {storyFn()}
  </ChakraProvider>
)

export const decorators = [withReactQuery, withChakra, mswDecorator]

export const parameters = {
  docs: {
    theme: StorybookTheme.docs,
    inlineStories: true,
  },
}
