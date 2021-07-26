import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

export type TagVariants = 'solid' | 'light'

export const Tag: ComponentMultiStyleConfig = {
  parts: [],
  baseStyle: {
    label: {
      textStyle: 'caption-1',
    },
  },
  variants: {
    solid: {
      container: {
        textColor: 'secondary.700',
        bgColor: 'success.400',
      },
    },
    light: {
      container: {
        bgColor: 'primary.100',
        textColor: 'primary.400',
      },
    },
  },
  sizes: {
    uni: {
      container: {
        p: '0.25rem',
        borderRadius: '0.25rem',
      },
    },
  },
  defaultProps: {
    variant: 'solid',
    size: 'uni',
  },
}
