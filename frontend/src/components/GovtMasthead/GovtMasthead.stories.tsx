import { Meta, StoryFn } from '@storybook/react'

import { viewports } from '~utils/storybook'

import {
  GovtMasthead as GovtMastheadComponent,
  GovtMastheadProps,
} from './GovtMasthead'

export default {
  title: 'Components/GovtMasthead',
  parameters: {
    layout: 'fullscreen',
  },
  component: GovtMastheadComponent,
  decorators: [],
} as Meta

const Template: StoryFn<GovtMastheadProps> = (args) => (
  <GovtMastheadComponent {...args} />
)

export const MobileDefault = Template.bind({})
MobileDefault.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const MobileExpanded = Template.bind({})
MobileExpanded.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}
MobileExpanded.storyName = 'Mobile/Expanded'
MobileExpanded.args = {
  defaultIsOpen: true,
}

export const DesktopDefault = Template.bind({})

export const DesktopExpanded = Template.bind({})
DesktopExpanded.storyName = 'Desktop/Expanded'
DesktopExpanded.args = {
  defaultIsOpen: true,
}
