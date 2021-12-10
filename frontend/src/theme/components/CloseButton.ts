import { getColor } from '@chakra-ui/theme-tools'

import { ComponentStyleConfig } from '~theme/types'

import { Button } from './Button'

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
    clear: (props) => Button.variants.clear(props),
  },
  defaultProps: {
    colorScheme: 'neutral',
    size: 'md',
  },
}
