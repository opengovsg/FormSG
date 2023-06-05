import { SimpleGrid, Text } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { Badge, BadgeProps } from './Badge'

export default {
  title: 'Components/Badge',
  component: Badge,
  decorators: [],
} as Meta<BadgeProps>

const Template: Story<BadgeProps> = (args) => <Badge {...args} />

export const Solid = Template.bind({})
Solid.args = {
  colorScheme: 'success',
  children: 'Badge name',
  variant: 'solid',
}

export const Subtle = Template.bind({})
Subtle.args = {
  children: 'Badge name',
  variant: 'subtle',
}

const TemplateGroup: Story<BadgeProps> = (args) => (
  <SimpleGrid
    columns={2}
    spacing={8}
    templateColumns="max-content max-content"
    alignItems="center"
  >
    <Text>primary</Text>
    <Badge {...args} colorScheme="primary" />
    <Text>secondary</Text>
    <Badge {...args} colorScheme="secondary" />
    <Text>warning</Text>
    <Badge {...args} colorScheme="warning" />
    <Text>success</Text>
    <Badge {...args} colorScheme="success" />
    <Text>neutral</Text>
    <Badge {...args} colorScheme="neutral" />
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
