import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  IconProps,
} from '@chakra-ui/react'

import { ThemeButtonVariants } from '~theme/components/Button'

import Spinner from '../Spinner'

export interface ButtonProps extends ChakraButtonProps {
  /**
   * The variant of the button.
   */
  variant?: ThemeButtonVariants

  /**
   * Loading spinner font size. Defaults to `1.5rem`.
   */
  spinnerFontSize?: IconProps['fontSize']
}

export const Button = ({
  children,
  spinnerFontSize,
  ...props
}: ButtonProps): JSX.Element => {
  return (
    <ChakraButton
      spinner={<Spinner fontSize={spinnerFontSize ?? '1.5rem'} />}
      {...props}
    >
      {children}
    </ChakraButton>
  )
}
