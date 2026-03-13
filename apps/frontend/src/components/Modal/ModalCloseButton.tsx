import { BiX } from 'react-icons/bi'
import {
  CloseButtonProps,
  ModalCloseButton as ChakraModalCloseButton,
} from '@chakra-ui/react'

export type ModalCloseButtonProps = CloseButtonProps

export const ModalCloseButton = ({
  children = <BiX fontSize="2rem" />,
  ...props
}: ModalCloseButtonProps): JSX.Element => {
  return (
    <ChakraModalCloseButton variant="clear" colorScheme="neutral" {...props}>
      {children}
    </ChakraModalCloseButton>
  )
}
