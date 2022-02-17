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
      _focus={{}}
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
    <Box sx={styles.usernameItem} aria-hidden>
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
    <Menu {...(isOpen ? { isOpen } : {})} autoSelect={false}>
      {({ isOpen }) => (
        <>
          <AvatarMenuButton role="group" isActive={isOpen}>
            <Avatar
              name={fullName}
              hasNotification={hasNotification}
              showBorder={isOpen}
              _groupFocus={{
                boxShadow: `0 0 0 4px var(--chakra-colors-primary-300)`,
              }}
              _groupHover={{
                bg: `var(--chakra-colors-primary-600)`,
              }}
              _groupActive={{
                bg: `var(--chakra-colors-primary-500)`,
              }}
            ></Avatar>
          </AvatarMenuButton>
          <Menu.List marginTop="0.375rem">
            <AvatarMenuUsername>{userName}</AvatarMenuUsername>
            <MenuDivider aria-hidden />
            {children}
          </Menu.List>
        </>
      )}
    </Menu>
  )
}
