import {
  ComponentStyleConfig,
  SystemStyleObject,
  ThemeComponentFunction,
} from '@chakra-ui/react'
import { getColor } from '@chakra-ui/theme-tools'

import { Button, ThemeButtonVariant } from './Button'

export const CloseButton: ComponentStyleConfig = {
  variants: {
    subtle: (props) => {
      const { theme, colorScheme: c } = props
      return {
        _focus: {
          boxShadow: `0 0 0 4px ${getColor(theme, `${c}.300`)}`,
        },
      }
    },
    clear: (props) => {
      const buttonFn = Button.variants as Record<
        ThemeButtonVariant,
        ThemeComponentFunction<SystemStyleObject>
      >
      return buttonFn['clear'](props)
    },
  },
  defaultProps: {
    colorScheme: 'neutral',
    size: 'md',
  },
}
