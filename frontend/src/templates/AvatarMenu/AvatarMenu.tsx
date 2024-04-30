import { useMemo } from 'react'
import {
  Avatar,
  AvatarBadge,
  AvatarProps,
  Box,
  Icon,
  MenuDivider,
  MenuItemProps,
  MenuListProps,
  MenuProps,
  Text,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { BxsUser } from '~/assets/icons/BxsUser'
import Menu, { MenuButtonProps } from '~/components/Menu'

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
      minH="auto"
      iconSpacing="0.5rem"
      color="secondary.300"
      chevronSize="1.5rem"
      _focus={{}}
      {...props}
    />
  )
}

/**
 * MenuItem styled for avatar username
 * @preconditions Must be a child of Menu component,
 */
const AvatarMenuUsername = ({ children }: MenuItemProps): JSX.Element => {
  // Required here due to nested style provider from menu.
  const styles = useMultiStyleConfig('AvatarMenu', {})

  return (
    <Box sx={styles.usernameItem} aria-hidden>
      <Icon as={BxsUser} sx={styles.usernameIcon} />
      <Text
        noOfLines={1}
        title={typeof children === 'string' ? children : undefined}
      >
        {children}
      </Text>
    </Box>
  )
}

/**
 * MenuDivider styled for avatar
 * @preconditions Must be a child of Menu component,
 */
export const AvatarMenuDivider = (): JSX.Element => {
  return <MenuDivider my="0.5rem" aria-hidden borderColor="neutral.300" />
}

export interface AvatarMenuProps
  extends Pick<MenuProps, 'defaultIsOpen' | 'children'>,
    Pick<AvatarProps, 'name' | 'colorScheme'> {
  /** Name to display in the username section of the menu */
  menuUsername?: string
  hasNotification?: boolean
  menuListProps?: MenuListProps
}

export const AvatarMenu = ({
  name,
  colorScheme = 'primary',
  menuUsername,
  hasNotification,
  defaultIsOpen,
  menuListProps,
  children,
}: AvatarMenuProps): JSX.Element => {
  const styles = useMultiStyleConfig('AvatarMenu', { colorScheme })
  const focusBoxShadow = useMemo(
    () => `0 0 0 4px var(--chakra-colors-${colorScheme}-300)`,
    [colorScheme],
  )

  return (
    <Menu autoSelect={false} defaultIsOpen={defaultIsOpen}>
      {({ isOpen }) => (
        <>
          <AvatarMenuButton isActive={isOpen} isOpen={isOpen}>
            <Avatar
              name={name}
              sx={styles.avatar}
              boxShadow={isOpen ? focusBoxShadow : undefined}
            >
              {hasNotification && <AvatarBadge />}
            </Avatar>
          </AvatarMenuButton>
          <Menu.List role="menu" marginTop="0.375rem" {...menuListProps}>
            <>
              <AvatarMenuUsername>{menuUsername}</AvatarMenuUsername>
              <AvatarMenuDivider />
              {children}
            </>
          </Menu.List>
        </>
      )}
    </Menu>
  )
}
