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
  chromatic: { viewports: [viewports.xs] },
}
MobileDefault.globals = { viewport: { value: 'mobile1', isRotated: false } }

export const MobileExpanded = Template.bind({})
MobileExpanded.parameters = {
  chromatic: { viewports: [viewports.xs] },
}
MobileExpanded.globals = { viewport: { value: 'mobile1', isRotated: false } }
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
