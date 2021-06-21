import 'focus-visible/dist/focus-visible.min.js'
import '../src/assets/fonts/inter.css'

import { ChakraProvider } from '@chakra-ui/react'
import { MINIMAL_VIEWPORTS } from '@storybook/addon-viewport'
import { DecoratorFn } from '@storybook/react'

import { theme } from '../src/theme'

import { StorybookTheme } from './themes'

const withChakra: DecoratorFn = (storyFn) => (
  <ChakraProvider resetCSS theme={theme}>
    {storyFn()}
  </ChakraProvider>
)

export const decorators = [withChakra]

// taken from https://support.microsoft.com/en-us/windows/change-your-screen-resolution-5effefe3-2eac-e306-0b5d-2073b765876b
const desktopViewports = {
  standardDesktop: {
    name: '19-inch standard desktop',
    styles: {
      width: '1280px',
      height: '1080px',
    },
  },
  widescreenDesktop: {
    name: '24-inch widescreen desktop',
    styles: {
      width: '1900px',
      height: '1200px',
    },
  },
}
export const parameters = {
  docs: {
    theme: StorybookTheme.docs,
    inlineStories: true,
  },
  viewport: {
    viewports: {
      ...MINIMAL_VIEWPORTS,
      ...desktopViewports,
    },
  },
}
