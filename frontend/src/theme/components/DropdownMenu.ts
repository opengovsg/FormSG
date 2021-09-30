import { ComponentMultiStyleConfig } from '@chakra-ui/react'

export const Menu: ComponentMultiStyleConfig = {
  parts: ['list', 'item'],
  baseStyle: {
    item: {
      padding: '0.75rem 1rem',
      fontWeight: '400',
      _hover: {
        padding: '0.75rem 1rem',
        background: 'primary.100',
        borderWidth: '0rem',
      },
      _focus: {
        padding: '0.625rem 0.875rem',
        background: 'white',
        borderWidth: '0.125rem',
        borderStyle: 'solid',
        borderColor: 'primary.500',
        borderRadius: '0.125rem',
      },
      _active: {
        padding: '0.75rem 1rem',
        borderWidth: '0rem',
        background: 'primary.200',
        fontWeight: '500',
      },
    },
    list: {
      minWidth: '0rem',
    },
  },
}
