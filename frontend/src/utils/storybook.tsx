import { Center } from '@chakra-ui/layout'
import { DecoratorFn } from '@storybook/react'

export const centerDecorator: DecoratorFn = (storyFn) => (
  <Center>{storyFn()}</Center>
)
