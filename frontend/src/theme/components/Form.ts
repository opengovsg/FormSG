import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

export const Form: ComponentMultiStyleConfig = {
  parts: ['helperText'],
  baseStyle: {
    helperText: {
      color: 'secondary.400',
      mt: 2,
      textStyle: 'body-2',
    },
  },
}
