import {
  Box,
  Icon,
  MenuDivider,
  MenuItemProps,
  MenuListProps,
  Text,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { BxsUser } from '~/assets/icons/BxsUser'
import Menu, { MenuButtonProps } from '~/components/Menu'

import { Avatar } from '../../components/Avatar/Avatar'

/**
 * MenuButton styled for avatar
 * Used to wrap Avatar component
 * @preconditions Must be a child of Menu component,
 * and returned using a render prop.
 */
const AvatarMenuButton = (props: MenuButtonProps): JSX.Element => {
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
      <Text
        noOfLines={1}
        title={typeof props.children === 'string' ? props.children : undefined}
      >
        {props.children}
      </Text>
    </Box>
  )
}

/**
 * MenuDivider styled for avatar
 * @preconditions Must be a child of Menu component,
 */
export const AvatarMenuDivider = (): JSX.Element => {
  return <MenuDivider aria-hidden borderColor="neutral.300" />
}

export type AvatarMenuProps = {
  fullName?: string
  userName?: string
  hasNotification?: boolean
  isOpen?: boolean
  menuListProps?: MenuListProps
  children?: React.ReactNode
}

export const AvatarMenu = ({
  fullName,
  userName,
  hasNotification,
  isOpen,
  menuListProps,
  children,
}: AvatarMenuProps): JSX.Element => {
  return (
    <Menu {...(isOpen ? { isOpen } : {})} autoSelect={false}>
      {({ isOpen }) => (
        <>
          <AvatarMenuButton isActive={isOpen}>
            <Avatar
              name={fullName}
              hasNotification={hasNotification}
              showBorder={isOpen}
              _groupFocus={{
                boxShadow: `0 0 0 4px var(--chakra-colors-primary-300)`,
              }}
              _groupHover={{
                bg: 'primary.600',
              }}
              _groupActive={{
                bg: 'primary.500',
              }}
            ></Avatar>
          </AvatarMenuButton>
          <Menu.List role="menu" marginTop="0.375rem" {...menuListProps}>
            <AvatarMenuUsername>{userName}</AvatarMenuUsername>
            <AvatarMenuDivider />
            {children}
          </Menu.List>
        </>
      )}
    </Menu>
  )
}
