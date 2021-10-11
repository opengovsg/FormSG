import { useEffect } from 'react'
import { Box, Center } from '@chakra-ui/react'
import { DecoratorFn } from '@storybook/react'

import { theme } from '~/theme'

import { LOGGED_IN_KEY } from '~constants/localStorage'

export const centerDecorator: DecoratorFn = (storyFn) => (
  <Center>{storyFn()}</Center>
)

export const fullScreenDecorator: DecoratorFn = (storyFn) => (
  <Box w="100vw" h="100vh">
    {storyFn()}
  </Box>
)

export const LoggedInDecorator: DecoratorFn = (storyFn) => {
  useEffect(() => {
    window.localStorage.setItem(LOGGED_IN_KEY, JSON.stringify(true))

    return () => window.localStorage.removeItem(LOGGED_IN_KEY)
  }, [])

  return storyFn()
}

/**
 * Helper function to convert theme breakpoint into viewport width in px for
 * Chromatic viewpoint snapshots.
 * @param breakpoint the theme breakpoint to convert
 * @returns the number pixel width of the given breakpoint.
 */
const breakpointToViewportWidth = (
  breakpoint: keyof typeof theme.breakpoints,
) => {
  const rem = 16
  return parseInt(theme.breakpoints[breakpoint]) * rem
}

/**
 * Viewports mapping viewport key to their width in (pixel) number.
 * Used for Chromatic viewpoint snapshots which requires the numbers in pixels.
 */
export const viewports = {
  xs: breakpointToViewportWidth('xs'),
  sm: breakpointToViewportWidth('sm'),
  md: breakpointToViewportWidth('md'),
  lg: breakpointToViewportWidth('lg'),
  xl: breakpointToViewportWidth('xl'),
}
