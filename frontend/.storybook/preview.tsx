/**
 * This file is used to add global decorators and parameters to all storybook stories.
 * @see https://storybook.js.org/docs/react/configure/overview#configure-story-rendering
 */
import 'inter-ui/inter.css'
import 'focus-visible/dist/focus-visible.min.js'

import { HelmetProvider } from 'react-helmet-async'
import { ChakraProvider } from '@chakra-ui/react'
import { DecoratorFn } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initialize, mswDecorator } from 'msw-storybook-addon'

import { AuthProvider } from '~contexts/AuthContext'
import * as dayjsUtils from '~utils/dayjs'

import i18n from '../src/i18n/i18n'
import { theme } from '../src/theme'

import { StorybookTheme } from './themes'

initialize()
dayjsUtils.init()

const withReactQuery: DecoratorFn = (storyFn) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        retry: false,
      },
    },
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
  i18n,
  locale: 'en-SG',
  locales: {
    'en-SG': 'English',
  },
  docs: {
    theme: StorybookTheme.docs,
    inlineStories: true,
  },
}
