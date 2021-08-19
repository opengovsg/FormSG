import { SimpleGrid, Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { Tag, TagProps } from './Tag'

export default {
  title: 'Components/Tag',
  component: Tag,
  decorators: [],
} as Meta

const Template: Story<TagProps> = (args) => <Tag {...args} />

export const Solid = Template.bind({})
Solid.args = {
  colorScheme: 'success',
  children: 'Tag Name',
  variant: 'solid',
}

export const Subtle = Template.bind({})
Subtle.args = {
  children: 'Tag Name',
  variant: 'subtle',
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
