import { Meta, Story } from '@storybook/react'

import { Attachment } from './Attachment'

export default {
  title: 'Components/Field/Attachment',
  component: Attachment,
  decorators: [],
} as Meta

export const Simple: Story = (args) => <Attachment {...args} />
Simple.bind({})

export const Complex: Story = (args) => <Attachment {...args} />
Complex.bind({})
