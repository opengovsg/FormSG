import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

export const FormError: ComponentMultiStyleConfig = {
  parts: ['text', 'icon'],
  baseStyle: {
    text: {
      color: 'danger.500',
      my: '0.5rem',
      textStyle: 'body-2',
    },
    icon: {
      marginEnd: '0.5em',
      color: 'danger.500',
      fontSize: '1rem',
    },
  },
}
