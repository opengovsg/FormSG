import { Center } from '@chakra-ui/layout'
import { DecoratorFn } from '@storybook/react'

import { theme } from '~/theme'

export const centerDecorator: DecoratorFn = (storyFn) => (
  <Center>{storyFn()}</Center>
)

type BreakpointKey = keyof typeof theme.breakpoints
const breakpointKeys = Object.keys(theme.breakpoints) as BreakpointKey[]
/**
 * Viewports mapping viewport key to their width in (pixel) number.
 */
export const viewports = breakpointKeys.reduce((acc, k: BreakpointKey) => {
  return { ...acc, k: parseInt(theme.breakpoints[k]) }
}, {} as Record<BreakpointKey, number>)
