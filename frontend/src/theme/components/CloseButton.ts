import {
  ComponentStyleConfig,
  SystemStyleObject,
  ThemeComponentFunction,
} from '@chakra-ui/react'

import { Button, ThemeButtonVariant } from './Button'

export const CloseButton: ComponentStyleConfig = {
  baseStyle: (props) => {
    const buttonFn = Button.variants as Record<
      ThemeButtonVariant,
      ThemeComponentFunction<SystemStyleObject>
    >
    return buttonFn['clear'](props)
  },
  defaultProps: {
    colorScheme: 'neutral',
    size: 'md',
  },
}
