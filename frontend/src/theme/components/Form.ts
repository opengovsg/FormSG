import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

import { textStyles } from '../textStyles'

export const Form: ComponentMultiStyleConfig = {
  parts: ['helperText'],
  baseStyle: {
    helperText: {
      color: 'secondary.400',
      mt: 2,
      ...textStyles['body-2'],
    },
  },
}
