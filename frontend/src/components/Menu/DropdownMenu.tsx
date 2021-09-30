import {
  Box,
  Icon,
  Menu as ChakraMenu,
  MenuButton as ChakraMenuButton,
  MenuItem as ChakraMenuItem,
  MenuList as ChakraMenuList,
  MenuProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { BxsChevronDown } from '~/assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~/assets/icons/BxsChevronUp'

export interface DropdownMenuButtonProps {
  /**
   * If true, the button will have a clear border
   */
  isClear?: boolean
  /**
   * Whether the menu has been opened
   */
  isActive: boolean
  /**
   * If true, the menu will take the full width of its container
   */
  isStretch?: boolean
  /**
   * Menu title
   */
  children: string
}

/**
 * @preconditions Must be a child of DropdownMenu component and returned
 * using a render prop (see implementation in DropdownMenu.stories)
 */
const DropdownMenuButton = ({
  isClear,
  children,
  isActive,
  isStretch,
}: DropdownMenuButtonProps): JSX.Element => {
  const styles = useMultiStyleConfig('Menu', {
    isActive,
  })
  return (
    <ChakraMenuButton
      padding={isActive ? '0.4375rem 0.9375rem' : '0.5rem 1rem'}
      borderWidth={isActive ? '0.125rem' : '0.0625rem'}
      borderColor={isClear ? 'white' : 'secondary.500'}
      minWidth={isStretch ? '100%' : 'max-content'}
      _hover={{ borderColor: isClear ? 'white' : 'secondary.700' }}
    >
      <Box sx={styles.content}>
        {children}
        {isActive ? (
          <Icon
            sx={styles.icon}
            as={BxsChevronUp}
            role={'presentation'}
            aria-hidden
          />
        ) : (
          <Icon
            sx={styles.icon}
            as={BxsChevronDown}
            role={'presentation'}
            aria-hidden
          />
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
const DropdownMenuList = ChakraMenuList

/**
 * Item in DropdownMenuList
 */
const DropdownMenuItem = ChakraMenuItem

/**
 * Used to wrap DropdownMenuButton, DropdownMenuItem and DropdownMenuList components
 */
export const DropdownMenu = (props: MenuProps): JSX.Element => {
  return <ChakraMenu {...props} matchWidth={true} gutter={4}></ChakraMenu>
}

DropdownMenu.DropdownMenuButton = DropdownMenuButton
DropdownMenu.DropdownMenuList = DropdownMenuList
DropdownMenu.DropdownMenuItem = DropdownMenuItem
