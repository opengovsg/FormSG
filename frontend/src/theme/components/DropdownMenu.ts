import { ComponentMultiStyleConfig } from '@chakra-ui/react'

export type DropdownMenuVariant = 'outline' | 'clear'
export type DropdownMenuSize = 'normal' | 'stretch'

export const DropdownMenu: ComponentMultiStyleConfig = {
  parts: ['outerbox', 'innerbox'],
  baseStyle: ({ isActive }) => ({
    outerBox: {
      padding: '4px',
      background: 'white',
      borderRadius: '8px',
      border: '0px',
      width: '177px',
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
      padding: '8px 16px',
      height: '44px',
      background: 'white',
      boxSizing: 'border-box',
      borderStyle: 'solid',
      borderWidth: isActive ? '2px' : '1px',
      borderRadius: '4px',
      borderColor: 'white',
    },
    text: {
      color: 'secondary.500',
      fontWeight: '500',
    },
  }),
  sizes: {
    stretch: {
      outerBox: {
        width: '304px',
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
    size: 'normal',
  },
}
