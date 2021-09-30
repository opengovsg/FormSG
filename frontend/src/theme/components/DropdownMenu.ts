import { ComponentMultiStyleConfig } from '@chakra-ui/react'

export const Menu: ComponentMultiStyleConfig = {
  parts: ['list', 'item'],
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
        background: 'white',
      },
      _active: {
        background: 'primary.200',
        fontWeight: '500',
      },
    },
    list: {
      minWidth: '0rem',
      padding: '0.125rem',
    },
  },
}
