import { useMemo } from 'react'
import {
  IconButton as ChakraIconButton,
  IconButtonProps as ChakraIconButtonProps,
  useTheme,
} from '@chakra-ui/react'

import { ThemeButtonVariant } from '~theme/components/Button'
import { ThemeColorScheme } from '~theme/foundations/colours'

import Spinner from '../Spinner'

export interface IconButtonProps extends ChakraIconButtonProps {
  /**
   * Size of the icon button.
   */
  size?: 'md' | 'lg'
  /**
   * The variant of the button.
   */
  variant?: ThemeButtonVariant

  /**
   * Color scheme of button.
   */
  colorScheme?: ThemeColorScheme
}

export const IconButton = (props: IconButtonProps): JSX.Element => {
  const theme = useTheme()
  const iconSize = useMemo(() => {
    if (props.fontSize) return props.fontSize

    if (props.size === 'lg') return theme.fontSizes.xl
    return theme.fontSizes[props.size ?? 'md']
  }, [props.fontSize, props.size, theme.fontSizes])

  return (
    <ChakraIconButton
      borderRadius="0.25rem"
      spinner={<Spinner fontSize={iconSize} />}
      {...props}
      fontSize={iconSize}
    />
  )
}
