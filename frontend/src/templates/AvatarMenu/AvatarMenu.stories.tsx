import { MenuDivider } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { Avatar } from '../../components/Avatar/Avatar'
import Menu from '../../components/Menu'

import { AvatarMenuProps } from './AvatarMenu'
import AvatarMenu from '.'

export default {
  title: 'Templates/AvatarMenu',
  component: Avatar,
} as Meta

type AvatarTemplateProps = AvatarMenuProps

const AvatarTemplate: Story<AvatarTemplateProps> = ({
  fullName,
  userName,
  hasNotification,
  isOpen,
  children,
}) => (
  <AvatarMenu
    fullName={fullName}
    userName={userName}
    hasNotification={hasNotification}
    isOpen={isOpen}
    children={children}
  />
)

const menuItems = (
  <>
    <Menu.Item>Billing</Menu.Item>
    <Menu.Item>Emergency contact</Menu.Item>
    <MenuDivider aria-hidden />
    <Menu.Item>Sign out</Menu.Item>
  </>
)

export const Default = AvatarTemplate.bind({})
Default.args = {
  fullName: 'My name',
  userName: 'someuser@email.com',
  hasNotification: false,
  isOpen: false,
  children: menuItems,
}

export const OpenMenu = AvatarTemplate.bind({})
OpenMenu.args = {
  fullName: 'My name',
  userName: 'someuser@email.com',
  hasNotification: false,
  isOpen: true,
  children: menuItems,
}

export const WithNotification = AvatarTemplate.bind({})
WithNotification.args = {
  fullName: 'My name',
  userName: 'someuser@email.com',
  hasNotification: true,
  isOpen: false,
  children: menuItems,
}

export const OpenMenuWithNotification = AvatarTemplate.bind({})
OpenMenuWithNotification.args = {
  fullName: 'My name',
  userName: 'someuser@email.com',
  hasNotification: true,
  isOpen: true,
  children: menuItems,
}
