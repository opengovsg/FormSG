import { Meta, StoryFn } from '@storybook/react'

import { Principles as Component } from './Principles'

export default {
  title: 'Introduction/Guiding principles',
  component: Component,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

export const Principles: StoryFn = () => <Component />
Principles.storyName = 'Guiding principles'
