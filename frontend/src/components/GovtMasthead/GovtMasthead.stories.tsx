import { Meta, Story } from '@storybook/react'

import {
  GovtMasthead as GovtMastheadComponent,
  GovtMastheadProps,
} from './GovtMasthead'

export default {
  title: 'Components/GovtMasthead',
  component: GovtMastheadComponent,
  decorators: [],
} as Meta

const Template: Story<GovtMastheadProps> = (args) => (
  <GovtMastheadComponent {...args} />
)
export const GovtMasthead = Template.bind({})
GovtMasthead.storyName = 'GovtMasthead'
