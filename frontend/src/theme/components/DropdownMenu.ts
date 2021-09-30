import { ComponentMultiStyleConfig } from '@chakra-ui/react'

export type DropdownMenuVariant = 'outline' | 'clear'
export type DropdownMenuSize = 'md' | 'lg'

export const DropdownMenu: ComponentMultiStyleConfig = {
  parts: ['outerBox', 'innerBox', 'option', 'text', 'menu'],
  baseStyle: ({ isActive }) => ({
    outerBox: {
      padding: '0.25rem',
      background: 'white',
      borderRadius: '0.5rem',
      border: '0rem',
      minWidth: '0rem',
      color: 'secondary.500',
      _hover: {
        background: 'white',
      },
      _focus: {
        background: 'secondary.300',
      },
      _active: {
        background: 'white',
      },
    },
    innerBox: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: isActive ? '0.4375rem 0.9375rem' : '0.5rem 1rem',
      height: '2.75rem',
      background: 'white',
      boxSizing: 'border-box',
      borderStyle: 'solid',
      borderWidth: isActive ? '0.125rem' : '0.0625rem',
      borderRadius: '0.25rem',
      borderColor: 'white',
    },
    option: {
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
    text: {
      marginRight: '1.5rem',
    },
    menuList: {
      minW: '0rem',
    },
  }),
  sizes: {
    lg: {
      outerBox: {
        minWidth: '100%',
      },
    },
  },
  variants: {
    outline: {
      innerBox: {
        borderColor: 'secondary.500',
        _hover: {
          borderColor: 'secondary.700',
        },
      },
    },
  },
  defaultProps: {
    variant: 'outline',
    size: 'md',
  },
}
