import { ComponentStyleConfig } from '~theme/types'

import { textStyles } from '../textStyles'

export type BadgeVariants = 'solid' | 'subtle'

export const Badge: ComponentStyleConfig = {
  baseStyle: {
    ...textStyles['caption-1'],
    textTransform: 'initial',
  },
  variants: {
    solid: ({ colorScheme: c }) => {
      const textColor = c === 'secondary' ? 'white' : 'secondary.700'

      return {
        textColor: textColor,
        bgColor: `${c}.400`,
      }
    },
    subtle: ({ colorScheme: c }) => {
      const textColor = ['primary', 'secondary'].includes(c ?? '')
        ? `${c}.500`
        : `${c}.800`

      return {
        bgColor: `${c}.100`,
        textColor,
      }
    },
  },
  sizes: {
    md: {
      py: '0.25rem',
      px: '0.5rem',
      borderRadius: '4px',
    },
  },
  defaultProps: {
    variant: 'solid',
    size: 'md',
    colorScheme: 'primary',
  },
}
