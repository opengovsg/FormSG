import {
  Avatar,
  AvatarBadge,
  AvatarProps,
  SimpleGrid,
  Text,
} from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

export default {
  title: 'Components/Avatar',
  component: Avatar,
  args: {
    name: 'ABC',
    size: 'md',
    colorScheme: 'primary',
  },
} as Meta<AvatarProps>

const Template: Story<AvatarProps> = (args) => {
  return <Avatar {...args} />
}

const GroupTemplate: Story = () => {
  return (
    <SimpleGrid
      columns={3}
      spacing={8}
      templateColumns="min-content min-content auto"
      alignItems="center"
    >
      <Text>xs</Text>
      <Avatar name="ABC" size="xs" />
      <Avatar name="ABC" size="xs">
        <AvatarBadge />
      </Avatar>
      <Text>sm</Text>
      <Avatar name="ABC" size="sm" />
      <Avatar name="ABC" size="sm">
        <AvatarBadge />
      </Avatar>
      <Text>md</Text>
      <Avatar name="ABC" size="md" />
      <Avatar name="ABC" size="md">
        <AvatarBadge />
      </Avatar>
      <Text>lg</Text>
      <Avatar name="ABC" size="lg" />
      <Avatar name="ABC" size="lg">
        <AvatarBadge />
      </Avatar>
      <Text>xl</Text>
      <Avatar name="ABC" size="xl" />
      <Avatar name="ABC" size="xl">
        <AvatarBadge />
      </Avatar>
    </SimpleGrid>
  )
}

export const Default = Template.bind({})

export const WithNotification = Template.bind({})
WithNotification.args = {
  children: <AvatarBadge />,
}

export const WithBorder = Template.bind({})
WithBorder.args = {
  boxShadow: `0 0 0 4px var(--chakra-colors-primary-300)`,
}

export const Group = GroupTemplate.bind({})
