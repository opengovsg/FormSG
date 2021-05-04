import { Meta, Story } from '@storybook/react'

import { Welcome as Component } from './Welcome'

export default {
  title: 'Welcome',
  component: Component,
} as Meta

export const Welcome = () => <Component />
