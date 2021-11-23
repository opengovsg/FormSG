import { Meta, Story } from '@storybook/react'

import { GovtMasthead, GovtMastheadProps } from './GovtMasthead'

export default {
  title: 'Components/GovtMasthead',
  component: GovtMasthead,
  decorators: [],
} as Meta

const Template: Story<GovtMastheadProps> = (args) => <GovtMasthead {...args} />
export const Default = Template.bind({})
Default.args = {}
