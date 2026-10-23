import { Meta, StoryFn } from '@storybook/react-vite'

import { viewportModes } from '~utils/storybook'

import {
  GovtMasthead as GovtMastheadComponent,
  GovtMastheadProps,
} from './GovtMasthead'

export default {
  title: 'Components/GovtMasthead',
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
  },
  component: GovtMastheadComponent,
  decorators: [],
} as Meta

const Template: StoryFn<GovtMastheadProps> = (args) => (
  <GovtMastheadComponent {...args} />
)

export const DesktopDefault = Template.bind({})
DesktopDefault.parameters = { argos: { modes: viewportModes('mobile') } }

export const DesktopExpanded = Template.bind({})
DesktopExpanded.parameters = { argos: { modes: viewportModes('mobile') } }
DesktopExpanded.storyName = 'Desktop/Expanded'
DesktopExpanded.args = {
  defaultIsOpen: true,
}
