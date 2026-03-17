import { BiX } from 'react-icons/bi'
import {
  CloseButtonProps,
  PopoverCloseButton as ChakraPopoverCloseButton,
} from '@chakra-ui/react'

export type PopoverCloseButtonProps = CloseButtonProps

export const PopoverCloseButton = ({
  children = <BiX fontSize="1.25rem" />,
  ...props
}: PopoverCloseButtonProps): JSX.Element => {
  return (
    <ChakraPopoverCloseButton
      variant="clear"
      colorScheme="secondary"
      {...props}
    >
      {children}
    </ChakraPopoverCloseButton>
  )
}
