import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

import { textStyles } from '../textStyles'

export type TagVariants = 'solid' | 'subtle'

const parts = ['container', 'label', 'closeButton']

export const Tag: ComponentMultiStyleConfig = {
  parts,
  baseStyle: {
    label: {
      ...textStyles['caption-1'],
    },
  },
  variants: {
    solid: ({ colorScheme: c }) => {
      const textColor = c === 'secondary' ? 'white' : 'secondary.700'

      return {
        container: {
          textColor: textColor,
          bgColor: `${c}.400`,
        },
      }
    },
    subtle: ({ colorScheme: c }) => {
      const textColor = ['primary', 'secondary'].includes(c ?? '')
        ? `${c}.500`
        : `${c}.800`

      return {
        container: {
          bgColor: `${c}.100`,
          textColor,
        },
      }
    },
  },
  sizes: {
    md: {
      container: {
        p: '0.25rem',
        borderRadius: '0.25rem',
      },
    },
  },
  defaultProps: {
    variant: 'solid',
    size: 'md',
    colorScheme: 'primary',
  },
}
