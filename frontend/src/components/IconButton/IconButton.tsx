import { useMemo } from 'react'
import {
  forwardRef,
  IconButton as ChakraIconButton,
  IconButtonProps as ChakraIconButtonProps,
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

export const IconButton = forwardRef<IconButtonProps, 'button'>(
  (props, ref) => {
    const iconSize = useMemo(() => {
      if (props.fontSize) return props.fontSize

      if (props.size === 'lg') return '1.5rem'
      return '1.25rem'
    }, [props.fontSize, props.size])

    return (
      <ChakraIconButton
        ref={ref}
        borderRadius="0.25rem"
        spinner={<Spinner fontSize={iconSize} />}
        {...props}
        fontSize={iconSize}
      />
    )
  },
)
