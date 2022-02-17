import {
  Box,
  ButtonProps,
  Icon,
  MenuDivider,
  MenuItemProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { BxsUser } from '~/assets/icons/BxsUser'
import Menu from '~/components/Menu'

import { Avatar } from '../../components/Avatar/Avatar'

/**
 * MenuButton styled for avatar
 * Used to wrap Avatar component
 * @preconditions Must be a child of Menu component,
 * and returned using a render prop.
 */
const AvatarMenuButton = (props: ButtonProps): JSX.Element => {
  return (
    <Menu.Button
      variant="clear"
      px="0"
      iconSpacing="0.5rem"
      color="secondary.300"
      chevronSize="24px"
      {...props}
    />
  )
}

/**
 * MenuItem styled for avatar username
 * @preconditions Must be a child of Menu component,
 */
const AvatarMenuUsername = (props: MenuItemProps): JSX.Element => {
  const styles = useMultiStyleConfig('AvatarMenu', {})

  const userIcon = <Icon as={BxsUser} sx={styles.usernameIcon} />

  return (
    <Box sx={styles.usernameItem}>
      {userIcon}
      {props.children}
    </Box>
  )
}

export type AvatarMenuProps = {
  fullName?: string
  userName?: string
  hasNotification?: boolean
  isOpen?: boolean
  children?: JSX.Element
}

export const AvatarMenu = ({
  fullName,
  userName,
  hasNotification,
  isOpen,
  children,
}: AvatarMenuProps): JSX.Element => {
  return (
    <Menu {...(isOpen ? { isOpen } : {})}>
      {({ isOpen }) => (
        <>
          <AvatarMenuButton isActive={isOpen}>
            <Avatar
              name={fullName}
              hasNotification={hasNotification}
              showBorder={isOpen}
            ></Avatar>
          </AvatarMenuButton>
          <Menu.List marginTop="0.375rem">
            <AvatarMenuUsername>{userName}</AvatarMenuUsername>
            <MenuDivider />
            {children}
          </Menu.List>
        </>
      )}
    </Menu>
  )
}
