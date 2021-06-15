import {
  Box,
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
   */
  colorScheme?: ThemeColorScheme
}

export const Button = ({
  children,
  spinnerFontSize,
  isFullWidth,
  textStyle = 'subhead-1',
  ...props
}: ButtonProps): JSX.Element => {
  return (
    <ChakraButton
      spinner={<Spinner fontSize={spinnerFontSize ?? '1.5rem'} />}
      isFullWidth={isFullWidth}
      {...props}
      // 15px due to 1px border
      {...(isFullWidth ? { p: '15px', h: 'auto' } : {})}
    >
      <Box textStyle={textStyle}>{children}</Box>
    </ChakraButton>
  )
}
