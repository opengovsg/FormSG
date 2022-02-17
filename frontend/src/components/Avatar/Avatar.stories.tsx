import { Meta, Story } from '@storybook/react'

import { Avatar } from './Avatar'

export default {
  title: 'Components/Avatar',
  component: Avatar,
} as Meta

type AvatarTemplateProps = {
  hasNotification?: boolean
  name?: string
}

const AvatarTemplate: Story<AvatarTemplateProps> = ({
  hasNotification,
  name,
}) => {
  return <Avatar hasNotification={hasNotification} name={name}></Avatar>
}

export const Default = AvatarTemplate.bind({})
Default.args = { hasNotification: false, name: 'ABC' }

export const WithNotification = AvatarTemplate.bind({})
WithNotification.args = { hasNotification: true, name: 'ABC' }
