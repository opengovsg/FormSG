import { ComponentMultiStyleConfig } from '@chakra-ui/react'

export const Menu: ComponentMultiStyleConfig = {
  parts: [
    'buttonBorder',
    'button',
    'content',
    'list',
    'item',
    'groupTitle',
    'command',
    'divider',
    'icon',
  ],
  baseStyle: {
    icon: {
      ml: '1.5rem',
    },
    button: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.5rem 1rem',
      height: '2.75rem',
      background: 'white',
      boxSizing: 'border-box',
      borderStyle: 'solid',
      borderWidth: '0.0625rem',
      borderRadius: '0.25rem',
      borderColor: 'white',
      minWidth: 'max-content',
      _focus: { boxShadow: '0 0 0 0.25rem var(--chakra-colors-secondary-300)' },
    },
    content: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
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
