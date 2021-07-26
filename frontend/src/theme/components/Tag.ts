import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

export type TagVariants = 'solid' | 'light'

export const Tag: ComponentMultiStyleConfig = {
  parts: [],
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
  defaultProps: {
    variant: 'primary',
  },
}
