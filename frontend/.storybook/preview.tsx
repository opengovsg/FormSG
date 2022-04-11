import 'focus-visible/dist/focus-visible.min.js'
import '../src/assets/fonts/inter.css'

import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ChakraProvider } from '@chakra-ui/react'
import { DecoratorFn } from '@storybook/react'
import { initialize, mswDecorator } from 'msw-storybook-addon'

import { AuthProvider } from '~contexts/AuthContext'
import * as dayjsUtils from '~utils/dayjs'

import { theme } from '../src/theme'

import { StorybookTheme } from './themes'

initialize()
dayjsUtils.init()

const withReactQuery: DecoratorFn = (storyFn) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity } },
  })
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

const withHelmet: DecoratorFn = (storyFn) => (
  <HelmetProvider>{storyFn()}</HelmetProvider>
)

export const decorators = [withReactQuery, withChakra, withHelmet, mswDecorator]

export const parameters = {
  docs: {
    theme: StorybookTheme.docs,
    inlineStories: true,
  },
}
