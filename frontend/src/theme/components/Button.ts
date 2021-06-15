import {
  ComponentStyleConfig,
  SystemStyleObject,
  ThemingPropsThunk,
} from '@chakra-ui/react'

export type ThemeButtonVariant =
  | 'primary'
  | 'danger'
  | 'success'
  | 'reverse'
  | 'outline'
  | 'clear'

export const Button: ComponentStyleConfig = {
  baseStyle: {
    borderRadius: '4px',
    border: '1px solid',
    textStyle: 'subhead-1',
    fontWeight: 'medium',
    px: '8px',
    py: '16px',
  },
  variants: {
    primary: {
      bg: 'primary.500',
      borderColor: 'primary.500',
      color: 'white',
      _active: {
        bg: 'primary.700',
        _disabled: {
          bg: 'primary.300',
        },
      },
      _focus: {
        borderColor: 'transparent',
        boxShadow: '0 0 0 4px var(--chakra-colors-primary-300)',
      },
      _disabled: {
        bg: 'primary.300',
        borderColor: 'primary.300',
        opacity: 1,
      },
      _hover: {
        bg: 'primary.600',
        _disabled: {
          bg: 'primary.300',
        },
      },
    },
    danger: {
      bg: 'danger.500',
      borderColor: 'danger.500',
      color: 'white',
      _active: {
        bg: 'danger.700',
        _disabled: {
          bg: 'danger.300',
        },
      },
      _focus: {
        borderColor: 'transparent',
        boxShadow: '0 0 0 4px var(--chakra-colors-danger-300)',
      },
      _disabled: {
        bg: 'danger.300',
        borderColor: 'danger.300',
        opacity: 1,
      },
      _hover: {
        bg: 'danger.600',
        _disabled: {
          bg: 'danger.300',
        },
      },
    },
    success: {
      bg: 'success.700',
      borderColor: 'success.700',
      color: 'white',
      _focus: {
        borderColor: 'transparent',
        boxShadow: '0 0 0 4px var(--chakra-colors-success-300)',
      },
      _disabled: {
        bg: 'success.300',
        borderColor: 'success.300',
        opacity: 1,
      },
      _active: {
        bg: 'success.800',
        _disabled: {
          bg: 'success.300',
        },
      },
      _hover: {
        bg: 'success.800',
        _disabled: {
          bg: 'success.300',
        },
      },
    },
    reverse: ({ colorScheme: c }) => ({
      bg: 'white',
      borderColor: 'transparent',
      color: `${c}.500`,
      _focus: {
        boxShadow: `0 0 0 4px var(--chakra-colors-${c}-300)`,
      },
      _disabled: {
        color: `${c}.400`,
        bg: 'white',
        opacity: 1,
      },
      _active: {
        bg: `${c}.200`,
        _disabled: {
          bg: 'white',
        },
      },
      _hover: {
        bg: `${c}.100`,
        _disabled: {
          bg: 'white',
        },
      },
    }),
    outline: ({ colorScheme: c }) => ({
      bg: 'white',
      borderColor: `${c}.500`,
      color: `${c}.500`,
      _focus: {
        boxShadow: `0 0 0 4px var(--chakra-colors-${c}-300)`,
      },
      _disabled: {
        borderColor: `${c}.400`,
        color: `${c}.400`,
        bg: 'white',
        opacity: 1,
      },
      _active: {
        bg: `${c}.200`,
        _disabled: {
          bg: 'white',
        },
      },
      _hover: {
        bg: `${c}.100`,
        _disabled: {
          bg: 'white',
        },
      },
    }),
    clear: ({ colorScheme: c }) => ({
      bg: 'transparent',
      borderColor: 'transparent',
      color: `${c}.500`,
      _focus: {
        boxShadow: `0 0 0 4px var(--chakra-colors-${c}-300)`,
      },
      _disabled: {
        color: `${c}.300`,
        opacity: 1,
      },
      _active: {
        bg: `${c}.200`,
        _disabled: {
          bg: 'transparent',
        },
      },
      _hover: {
        bg: `${c}.100`,
        _disabled: {
          bg: 'transparent',
        },
      },
    }),
  } as Record<ThemeButtonVariant, ThemingPropsThunk<SystemStyleObject>>,
  defaultProps: {
    variant: 'primary',
    colorScheme: 'primary',
  },
}
