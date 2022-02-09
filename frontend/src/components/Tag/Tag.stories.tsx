import { BiRadioCircleMarked } from 'react-icons/bi'
import { SimpleGrid, Text } from '@chakra-ui/react'
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

const TemplateGroup: Story<TagProps> = (args) => (
  <SimpleGrid
    columns={2}
    spacing={8}
    templateColumns="max-content max-content"
    alignItems="center"
  >
    <Text>primary</Text>
    <Tag {...args} colorScheme="primary" />
    <Text>secondary</Text>
    <Tag {...args} colorScheme="secondary" />
    <Text>warning</Text>
    <Tag {...args} colorScheme="warning" />
    <Text>success</Text>
    <Tag {...args} colorScheme="success" />
    <Text>neutral</Text>
    <Tag {...args} colorScheme="neutral" />
  </SimpleGrid>
)

export const SubtleColours = TemplateGroup.bind({})
SubtleColours.args = {
  children: 'Subtle',
  variant: 'subtle',
}

export const SolidColours = TemplateGroup.bind({})
SolidColours.args = {
  children: 'Solid',
  variant: 'solid',
}
