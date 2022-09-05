import { Meta } from '@storybook/react'

import { Welcome as Component } from './Welcome'

export default {
  title: 'Introduction/Welcome',
  component: Component,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

export const Welcome = () => <Component />
