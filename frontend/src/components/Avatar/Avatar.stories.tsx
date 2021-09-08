import { Box, MenuDivider, SimpleGrid } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import DropdownMenu from '../Menu'

import { Avatar } from './Avatar'

export default {
  title: 'Components/Avatar',
  component: Avatar,
} as Meta

type AvatarGroupTemplateProps = {
  fullName?: string
  userName?: string
  hasNotification?: boolean
}

type AvatarTemplateProps = {
  fullName?: string
  userName?: string
  hasNotification?: boolean
  isOpen?: boolean
}

const AvatarTemplate: Story<AvatarTemplateProps> = ({
  fullName,
  userName,
  hasNotification,
  isOpen,
}) => {
  return (
    <DropdownMenu {...(isOpen ? { isOpen } : {})}>
      {({ isOpen }) => (
        <>
          <Avatar.MenuButton isActive={isOpen}>
            <Avatar name={fullName} hasNotification={hasNotification}></Avatar>
          </Avatar.MenuButton>
          <DropdownMenu.List>
            <Avatar.Username>{userName}</Avatar.Username>
            <MenuDivider />
            <DropdownMenu.Item>Billing</DropdownMenu.Item>
            <DropdownMenu.Item>Emergency contact</DropdownMenu.Item>
            <MenuDivider />
            <DropdownMenu.Item>Sign out</DropdownMenu.Item>
          </DropdownMenu.List>
        </>
      )}
    </DropdownMenu>
  )
}

const AvatarGroupTemplate: Story<AvatarGroupTemplateProps> = ({
  fullName,
  userName,
  hasNotification,
}) => {
  return (
    <SimpleGrid
      columns={2}
      spacing={'200px'}
      alignItems="center"
      templateColumns="min-content min-content"
    >
      <Box>
        Closed
        <AvatarTemplate
          fullName={fullName}
          userName={userName}
          hasNotification={hasNotification}
        ></AvatarTemplate>
      </Box>
      <Box>
        Open
        <AvatarTemplate
          fullName={fullName}
          userName={userName}
          hasNotification={hasNotification}
          isOpen
        ></AvatarTemplate>
      </Box>
    </SimpleGrid>
  )
}
export const Default = AvatarGroupTemplate.bind({})
Default.args = {
  fullName: 'My name',
  userName: 'someuser@email.com',
}

export const WithNotification = AvatarGroupTemplate.bind({})
WithNotification.args = {
  fullName: 'My name',
  userName: 'someuser@email.com',
  hasNotification: true,
}
