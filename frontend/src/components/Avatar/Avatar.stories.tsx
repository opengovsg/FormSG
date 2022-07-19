import { Avatar, AvatarBadge, AvatarProps } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

export default {
  title: 'Components/Avatar',
  component: Avatar,
  args: {
    name: 'ABC',
    size: 'md',
  },
} as Meta<AvatarProps>

const Template: Story<AvatarProps> = (args) => {
  return <Avatar {...args} />
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
