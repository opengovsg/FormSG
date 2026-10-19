import { Meta, StoryFn } from '@storybook/react-vite'

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
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  chromatic: { viewports: [viewports.xs] },
}

export const MobileExpanded = Template.bind({})
MobileExpanded.parameters = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
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
