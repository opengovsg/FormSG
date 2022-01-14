import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  forwardRef,
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
   */
  colorScheme?: ThemeColorScheme
}

export const Button = forwardRef<ButtonProps, 'button'>(
  ({ children, spinnerFontSize, isFullWidth, ...props }, ref) => {
    return (
      <ChakraButton
        ref={ref}
        spinner={<Spinner fontSize={spinnerFontSize ?? '1.5rem'} />}
        isFullWidth={isFullWidth}
        {...props}
        {...(isFullWidth ? { minH: '3.5rem' } : {})}
      >
        {children}
      </ChakraButton>
    )
  },
)
