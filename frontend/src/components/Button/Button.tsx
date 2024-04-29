import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  forwardRef,
  IconProps,
} from '@chakra-ui/react'

import { ThemeColorScheme } from '~theme/foundations/colours'

import Spinner from '../Spinner'

export interface ButtonProps extends ChakraButtonProps {
  /**
   * Loading spinner font size. Defaults to `1.5rem`.
   */
  spinnerFontSize?: IconProps['fontSize']

  /**
   * Color scheme of button.
   */
  colorScheme?: ThemeColorScheme
  /**
   * Base color intensity of button.
   */
  basecolorintensity?: 500 | 600

  /**
   * @note backwards compatibility with Chakra V1
   */
  isFullWidth?: boolean
}

export const Button = forwardRef<ButtonProps, 'button'>(
  ({ children, spinnerFontSize, isFullWidth, ...props }, ref) => {
    return (
      <ChakraButton
        ref={ref}
        spinner={<Spinner fontSize={spinnerFontSize ?? '1.5rem'} />}
        width={isFullWidth ? '100%' : undefined}
        {...props}
        {...(isFullWidth ? { minH: '3.5rem' } : {})}
      >
        {children}
      </ChakraButton>
    )
  },
)
