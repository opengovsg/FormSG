/**
 * This file is used to add global decorators and parameters to all storybook stories.
 * @see https://storybook.js.org/docs/react/configure/overview#configure-story-rendering
 */
import 'inter-ui/inter.css'

import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ChakraProvider } from '@chakra-ui/react'
import { withThemeFromJSXProvider } from '@storybook/addon-themes'
import { Decorator, ReactRenderer } from '@storybook/react'
import { initialize, mswDecorator } from 'msw-storybook-addon'

import { AuthProvider } from '~contexts/AuthContext'
import * as dayjsUtils from '~utils/dayjs'

import i18n from '../src/i18n/i18n'
import { theme } from '../src/theme'

import { StorybookTheme } from './themes'

initialize({
  onUnhandledRequest: 'bypass',
})
dayjsUtils.init()

const withReactQuery: Decorator = (storyFn) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        retry: false,
      },
    },
  })
  return (
    // FIXME: react 18 types
    // @ts-expect-error missing FC type in old version
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{storyFn()}</AuthProvider>
    </QueryClientProvider>
  )
}

const withHelmet: Decorator = (storyFn) => (
  <HelmetProvider>{storyFn()}</HelmetProvider>
)

export const decorators = [
  withReactQuery,
  withHelmet,
  withThemeFromJSXProvider<ReactRenderer>({
    themes: {
      default: theme,
    },
    Provider: ChakraProvider,
  }),
  mswDecorator,
]

export const parameters = {
  i18n,
  locale: 'en-SG',
  locales: {
    'en-SG': 'English',
  },
  layout: 'fullscreen',
  docs: {
    theme: StorybookTheme.docs,
    inlineStories: true,
  },
}
