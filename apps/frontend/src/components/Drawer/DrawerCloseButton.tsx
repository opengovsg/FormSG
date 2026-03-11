import { BiX } from 'react-icons/bi'
import {
  CloseButtonProps,
  DrawerCloseButton as ChakraDrawerCloseButton,
} from '@chakra-ui/react'

export type DrawerCloseButtonProps = CloseButtonProps

export const DrawerCloseButton = ({
  children = <BiX fontSize="1.25rem" />,
  ...props
}: DrawerCloseButtonProps): JSX.Element => {
  return (
    <ChakraDrawerCloseButton variant="clear" colorScheme="neutral" {...props}>
      {children}
    </ChakraDrawerCloseButton>
  )
}
