import { Center } from '@chakra-ui/layout'
import { DecoratorFn } from '@storybook/react'

import { theme } from '~/theme'

export const centerDecorator: DecoratorFn = (storyFn) => (
  <Center>{storyFn()}</Center>
)

/**
 * Viewports mapping viewport key to their width in (pixel) number.
 * Used for Chromatic viewpoint snapshots which requires the numbers in pixels.
 */
export const viewports = {
  xs: parseInt(theme.breakpoints['xs']) * 16,
  sm: parseInt(theme.breakpoints['sm']) * 16,
  md: parseInt(theme.breakpoints['md']) * 16,
  lg: parseInt(theme.breakpoints['lg']) * 16,
  xl: parseInt(theme.breakpoints['xl']) * 16,
}
