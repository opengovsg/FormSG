import { formAnatomy as parts } from '@chakra-ui/anatomy'

import { ComponentMultiStyleConfig } from '~theme/types'

export const Form: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  baseStyle: {
    helperText: {
      color: 'brand.secondary.400',
      mt: 2,
      textStyle: 'body-2',
      lineHeight: '1.25rem',
    },
  },
}
