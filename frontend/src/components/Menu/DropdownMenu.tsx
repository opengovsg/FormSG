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
 * @preconditions Must be a child of DropdownMenu component,
 * and returned using a render prop (see implementation in DropdownMenu.stories).
 */
const DropdownMenuButton = (props: ButtonProps): JSX.Element => {
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
      _hover={{ bgColor: 'white' }}
      _active={{
        bgColor: 'white',
        boxShadow: isVariantOutline ? '0 0 0 0.0625rem black' : '',
      }}
      {...props}
    ></ChakraMenuButton>
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
  return <ChakraMenu matchWidth={true} gutter={4} {...props}></ChakraMenu>
}

DropdownMenu.Button = DropdownMenuButton
DropdownMenu.List = DropdownMenuList
DropdownMenu.Item = DropdownMenuItem
