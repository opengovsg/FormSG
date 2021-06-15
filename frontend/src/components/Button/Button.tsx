import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  IconProps,
} from '@chakra-ui/react'

import { ThemeButtonVariant } from '~theme/components/Button'
import { ThemeColorScheme } from '~theme/foundations/colours'

import Spinner from '../Spinner'

export interface ButtonProps extends ChakraButtonProps {
  /**
   * The variant of the button.
   */
  variant?: ThemeButtonVariant

  /**
   * Loading spinner font size. Defaults to `1.5rem`.
   */
  spinnerFontSize?: IconProps['fontSize']

  /**
   * Color scheme of button.
   * Only applies to `reverse`, `outline`, and `clear` variant.
   */
  colorScheme?: ThemeColorScheme
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
