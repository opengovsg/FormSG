/**
 * This file is used to add global decorators and parameters to all storybook stories.
 * @see https://storybook.js.org/docs/react/configure/overview#configure-story-rendering
 */
import 'inter-ui/inter.css'

import { HelmetProvider } from 'react-helmet-async'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ChakraProvider } from '@chakra-ui/react'
import { withThemeFromJSXProvider } from '@storybook/addon-themes'
import { Decorator, ReactRenderer } from '@storybook/react-vite'
import { initialize, mswDecorator, mswLoader } from 'msw-storybook-addon'

import { envHandlers } from '~/mocks/msw/handlers/env'
import { featureFlagHandlers } from '~/mocks/msw/handlers/feature-flag'

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
  mswDecorator, // TODO: remove this in favor of `const loaders = [mswLoader]`. Unable to remove due to FE vitest failing
]

export const parameters = {
  i18n,
  locale: 'en-SG',
  locales: {
    'en-SG': 'English',
  },
  layout: 'fullscreen',
  // Capture the whole viewport: modals render in a portal, so cropping to the
  // story root leaves Argos with nothing to measure and the screenshot hangs.
  argos: { fitToContent: false },
  viewport: {
    // Argos reads sizes from here, so the keys stories use are defined
    // explicitly rather than relying on the addon defaults.
    options: {
      mobile1: { name: 'Mobile', styles: { width: '320px', height: '568px' } },
      tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
      desktop1: {
        name: 'Desktop',
        styles: { width: '1280px', height: '800px' },
      },
    },
  },
  docs: {
    theme: StorybookTheme.docs,
    inlineStories: true,
  },
  msw: {
    handlers: {
      env: envHandlers,
      featureFlag: featureFlagHandlers,
    },
  },
}

export const loaders = [mswLoader]

export const initialGlobals = {
  viewport: {
    value: 'reset',
    isRotated: false,
  },
}
