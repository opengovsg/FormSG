import { menuAnatomy as parts } from '@chakra-ui/anatomy'

import { ComponentMultiStyleConfig } from '~theme/types'

export const Menu: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  baseStyle: {
    item: {
      padding: '0.75rem 1rem',
      fontWeight: '400',
      _hover: {
        background: 'primary.100',
        borderWidth: '0rem',
      },
      _focus: {
        outlineWidth: '0.125rem',
        outlineStyle: 'solid',
        outlineColor: 'primary.500',
      },
      _active: {
        background: 'primary.200',
        fontWeight: '500',
      },
    },
    list: {
      minWidth: '0rem',
    },
  },
}
