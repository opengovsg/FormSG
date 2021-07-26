import { Meta, Story } from '@storybook/react'

import { Tag, TagProps } from './Tag'

export default {
  title: 'Components/Tag',
  component: Tag,
  decorators: [],
} as Meta

const Template: Story<TagProps> = (args) => {
  return <Tag {...args}>Tag Name</Tag>
}
export const Solid = Template.bind({})
Solid.args = {
  variant: 'solid',
}

export const Light = Template.bind({})
Light.args = {
  variant: 'light',
}
export const Playground: Story = ({ variant, label }) => {
  return <Tag variant={variant}>{label}</Tag>
}

Playground.args = {
  label: "Tag you're it",
  variant: 'light',
}
