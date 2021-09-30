import {
  Button,
  ButtonProps,
  Menu as ChakraMenu,
  MenuButton as ChakraMenuButton,
  MenuItem as ChakraMenuItem,
  MenuList as ChakraMenuList,
  MenuProps,
} from '@chakra-ui/react'

import { BxsChevronDown } from '~/assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~/assets/icons/BxsChevronUp'

/**
 * @preconditions Must be a child of Menu component,
 * and returned using a render prop (see implementation in Menu.stories).
 */
const MenuButton = (props: ButtonProps): JSX.Element => {
  const ChevronIcon = props.isActive ? <BxsChevronUp /> : <BxsChevronDown />
  const isVariantOutline = !props.variant || props.variant === 'outline'

  return (
    <ChakraMenuButton
      as={Button}
      variant="outline"
      colorScheme="secondary"
      textAlign="left"
      rightIcon={ChevronIcon}
      iconSpacing="1.5rem"
      _hover={{
        bgColor: 'white',
        borderColor: 'secondary.900',
        color: 'secondary.900',
      }}
      _active={{
        bgColor: 'white',
        boxShadow: isVariantOutline ? '0 0 0 0.0625rem black' : '',
      }}
      {...props}
    ></ChakraMenuButton>
  )
}

/**
 * @preconditions Must be a child of Menu component
 * after MenuButton, and returned using a render prop
 * (see implementation in Menu.stories).
 *
 * Used to wrap MenuItem component
 */
const MenuList = ChakraMenuList

/**
 * Item in MenuList
 */
const MenuItem = ChakraMenuItem

/**
 * Used to wrap MenuButton, MenuItem and MenuList components
 */
export const Menu = (props: MenuProps): JSX.Element => {
  return <ChakraMenu matchWidth={true} gutter={4} {...props}></ChakraMenu>
}

Menu.Button = MenuButton
Menu.List = MenuList
Menu.Item = MenuItem
