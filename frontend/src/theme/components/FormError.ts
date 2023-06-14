import { formErrorAnatomy as parts } from '@chakra-ui/anatomy'

import { ComponentMultiStyleConfig } from '~theme/types'

export const FormError: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  baseStyle: {
    text: {
      color: 'danger.500',
      my: '0.5rem',
      textStyle: 'body-2',
      lineHeight: '1.25rem',
    },
    icon: {
      marginEnd: '0.5em',
      color: 'danger.500',
      fontSize: '1rem',
    },
  },
  variants: {
    white: {
      text: {
        color: 'white',
      },
      icon: {
        color: 'white',
      },
    },
  },
}
