import { ComponentMultiStyleConfig } from '@chakra-ui/react'

export type DropdownMenuVariant = 'outline' | 'clear'
export type DropdownMenuSize = 'normal' | 'stretch'

export const DropdownMenu: ComponentMultiStyleConfig = {
  parts: ['outerbox', 'innerbox'],
  baseStyle: {
    outerBox: {
      padding: '4px',
      borderRadius: '8px',
      width: '177px',
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
      borderWidth: '1px',
      borderRadius: '4px',
      borderColor: 'white',
    },
    text: {
      color: 'secondary.500',
      fontWeight: '500',
    },
  },
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
        _focus: {
          outline: '4px solid',
          outlineColor: 'secondary.300',
        },
        _active: {
          borderWidth: '2px',
          outline: '4px solid',
          outlineColor: 'secondary.300',
        },
      },
    },
  },
  defaultProps: {
    variant: 'outline',
    size: 'normal',
  },
}
