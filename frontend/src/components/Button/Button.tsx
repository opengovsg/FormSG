import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
} from '@chakra-ui/react'
import { FC } from 'react'

import { ThemeButtonVariants } from '../../theme/components/Button'
import { Spinner } from '../Spinner'

export interface ButtonProps extends ChakraButtonProps {
  /**
   * The variant of the button.
   */
  variant?: ThemeButtonVariants
}

export const Button: FC<ButtonProps> = ({ children, ...props }) => (
  <ChakraButton spinner={<Spinner fontSize="24px" />} {...props}>
    {children}
  </ChakraButton>
)
