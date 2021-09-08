import {
  Avatar as ChakraAvatar,
  AvatarBadge as ChakraAvatarBadge,
  AvatarProps as ChakraAvatarProps,
  Box,
  ButtonProps,
  Icon,
  MenuItemProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { BxsUser } from '~/assets/icons/BxsUser'

import DropdownMenu from '../Menu'

export interface AvatarProps extends ChakraAvatarProps {
  hasNotification?: boolean
}

/*
 * Utility to extract first letter of avatar name
 * Override default getInitials Avatar method
 */
const getInitials = (fullName: string) => fullName[0]

/*
 * Avatar component
 * May be wrapped in AvatarMenuButton
 */
export const Avatar = (props: AvatarProps): JSX.Element => {
  const avatarBadge = props.hasNotification ? <ChakraAvatarBadge /> : ''

  return (
    <ChakraAvatar getInitials={getInitials} {...props}>
      {avatarBadge}
    </ChakraAvatar>
  )
}

/**
 * DropdownMenuButton styled for avatar
 * Used to wrap Avatar component
 * @preconditions Must be a child of DropdownMenu component,
 * and returned using a render prop (see implementation in Avatar.stories).
 */
const AvatarMenuButton = (props: ButtonProps): JSX.Element => {
  return (
    <DropdownMenu.Button
      variant="clear"
      px="0"
      iconSpacing="0.5rem"
      color="secondary.300"
      {...props}
    ></DropdownMenu.Button>
  )
}

/**
 * DropdownMenuItem styled for avatar username
 * @preconditions Must be a child of DropdownMenu component,
 */
const AvatarUsername = (props: MenuItemProps): JSX.Element => {
  const styles = useMultiStyleConfig('Avatar', {})

  const userIcon = <Icon as={BxsUser} sx={styles.usernameIcon}></Icon>

  return (
    <Box sx={styles.usernameItem}>
      {userIcon}
      {props.children}
    </Box>
  )
}

Avatar.MenuButton = AvatarMenuButton
Avatar.Username = AvatarUsername
