import {
  Box,
  Button,
  Menu as ChakraMenu,
  MenuButton as ChakraMenuButton,
  MenuItem as ChakraMenuItem,
  MenuItemProps,
  MenuList as ChakraMenuList,
  MenuListProps,
  MenuProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { BxsChevronDown } from '~/assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~/assets/icons/BxsChevronUp'
import {
  DropdownMenuSize,
  DropdownMenuVariant,
} from '~/theme/components/DropdownMenu'

export interface DropdownMenuButtonProps {
  /**
   * The variant of the dropdown menu.
   */
  variant: DropdownMenuVariant
  /**
   * Whether the menu has been opened
   */
  isActive: boolean
  /**
   * The size of the dropdown menu - stretched or not.
   */
  size: DropdownMenuSize
  /**
   * Menu title
   */
  children: string
}

/**
 * @preconditions Must be a child of DropdownMenu component and returned
 * using a render prop (see implementation in DropdownMenu.stories)
 */
export const DropdownMenuButton = ({
  variant = 'outline',
  children,
  isActive,
  size,
}: DropdownMenuButtonProps): JSX.Element => {
  const styles = useMultiStyleConfig('DropdownMenu', {
    variant,
    size,
    isActive,
  })
  return (
    <ChakraMenuButton
      sx={styles.outerBox}
      as={Button}
      //  For rounded outline
    >
      <Box sx={styles.innerBox} role={'presentation'} aria-hidden>
        <Box sx={styles.text} role={'presentation'} aria-hidden>
          {children}
        </Box>
        {isActive ? (
          <BxsChevronUp role={'presentation'} aria-hidden />
        ) : (
          <BxsChevronDown role={'presentation'} aria-hidden />
        )}
      </Box>
    </ChakraMenuButton>
  )
}

/**
 * @preconditions Must be a child of DropdownMenu component
 * after DropdownMenuButton, and returned using a render prop
 * (see implementation in DropdownMenu.stories).
 *
 * Used to wrap MenuItem component
 */
export const DropdownMenuList = (props: MenuListProps): JSX.Element => {
  const styles = useMultiStyleConfig('DropdownMenu', {})
  return <ChakraMenuList {...props} sx={styles.menuList}></ChakraMenuList>
}

/**
 * Used to wrap DropdownMenuButton and DropdownMenuList components
 */
export const DropdownMenu = (props: MenuProps): JSX.Element => {
  return <ChakraMenu {...props} matchWidth={true} gutter={4}></ChakraMenu>
}

/**
 * Item in DropdownMenuList
 */
export const DropdownMenuItem = (props: MenuItemProps): JSX.Element => {
  const styles = useMultiStyleConfig('DropdownMenu', {})
  return <ChakraMenuItem {...props} sx={styles.option}></ChakraMenuItem>
}
