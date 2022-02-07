import { BiRadioCircleMarked } from 'react-icons/bi'
import { Meta, Story } from '@storybook/react'

import { Tag, TagCloseButton, TagLeftIcon, TagProps, TagRightIcon } from './Tag'

export default {
  title: 'Components/Tag',
  component: Tag,
  decorators: [],
} as Meta

const Template: Story<TagProps> = (args) => <Tag {...args} />
export const Subtle = Template.bind({})
Subtle.args = {
  children: 'Subtle tag',
  variant: 'subtle',
}
export const Solid = Template.bind({})
Solid.args = {
  children: 'Solid tag',
  variant: 'solid',
  colorScheme: 'secondary',
}

export const WithCloseButton = Template.bind({})
WithCloseButton.args = {
  children: (
    <>
      Solid tag
      <TagCloseButton />
    </>
  ),
  variant: 'subtle',
  colorScheme: 'secondary',
}

export const WithLeftRightIcon = Template.bind({})
WithLeftRightIcon.args = {
  children: (
    <>
      <TagLeftIcon as={BiRadioCircleMarked} />
      Solid tag
      <TagRightIcon as={BiRadioCircleMarked} />
    </>
  ),
  variant: 'solid',
  colorScheme: 'secondary',
}
