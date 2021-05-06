import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
} from '@chakra-ui/react'
import { FC } from 'react'

import { Spinner } from '../Spinner'

export const Button: FC<ChakraButtonProps> = ({ children, ...props }) => (
  <ChakraButton spinner={<Spinner fontSize="24px" />} {...props}>
    {children}
  </ChakraButton>
)
