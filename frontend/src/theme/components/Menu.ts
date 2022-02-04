import { menuAnatomy as parts } from '@chakra-ui/anatomy'
import { getColor } from '@chakra-ui/theme-tools'

import { ComponentMultiStyleConfig } from '~theme/types'

export type MenuVariant = 'outline' | 'clear'

export const Menu: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  baseStyle: ({
    colorScheme: c,
    isStretch,
    theme,
    focusItemBorderColor: fc,
  }) => ({
    button: {
      width: isStretch ? '100%' : undefined,
      textAlign: 'left',
      justifyContent: 'space-between',
      _hover: {
        bg: 'white',
        color: `${c}.900`,
      },
      _active: {
        bg: 'white',
        color: `${c}.500`,
        _hover: {
          color: `${c}.900`,
        },
      },
    },
    item: {
      padding: '0.75rem 1rem',
      fontWeight: '400',
      _hover: {
        bg: 'primary.100',
        borderWidth: '0rem',
      },
      _focus: {
        bg: 'primary.100',
        boxShadow: `0 0 0 2px ${getColor(theme, fc)}`,
        _active: {
          bg: 'primary.200',
        },
      },
      _active: {
        bg: 'primary.200',
        fontWeight: 500,
      },
      _disabled: {
        opacity: 0.6,
        bg: 'initial',
        _hover: {
          bg: 'initial',
        },
        _active: {
          fontWeight: 'initial',
        },
        cursor: 'not-allowed',
      },
    },
    list: {
      border: 'none',
      borderRadius: 0,
      minWidth: '0rem',
      shadow: 'var(--chakra-shadows-sm) !important',
    },
  }),
  variants: {
    clear: {
      button: {
        minH: 'auto',
        p: '0.25rem',
        outline: 'none',
        border: 'none',
        boxShadow: 'none',
      },
    },
    outline: ({ colorScheme: c, theme }) => {
      return {
        button: {
          _hover: {
            borderColor: `${c}.900`,
          },
          _active: {
            boxShadow: `0 0 0 1px ${getColor(theme, `${c}.500`)}`,
            _hover: {
              boxShadow: `0 0 0 1px ${getColor(theme, `${c}.900`)}`,
            },
          },
        },
      }
    },
  },
  defaultProps: {
    colorScheme: 'secondary',
    focusItemBorderColor: 'primary.500',
    variant: 'outline',
  },
}
