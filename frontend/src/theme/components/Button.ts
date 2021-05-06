import { ComponentStyleConfig, SystemStyleObject, ThemingPropsThunk } from '@chakra-ui/react'

export type ThemeButtonVariants = "primary" | "danger" | "success" | "reverse" | "outline" | "clear"

export const Button: ComponentStyleConfig = {
  baseStyle: {
    borderRadius: '4px',
    border: '1px solid',
    textStyle: 'subhead-1',
    px: '8px',
    py: '16px',
  },
  variants: {
    primary: {
      bg: 'primary.500',
      borderColor: 'primary.500',
      color: 'white',
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
      _hover: {
        bg: 'success.800',
        _disabled: {
          bg: 'success.300',
        },
      },
    },
    reverse: {
      bg: 'transparent',
      borderColor: 'transparent',
      color: 'primary.500',
      _focus: {
        boxShadow: '0 0 0 4px var(--chakra-colors-primary-300)',
      },
      _disabled: {
        color: 'primary.400',
        opacity: 1,
      },
      _hover: {
        bg: 'primary.100',
        _disabled: {
          bg: 'transparent',
        },
      },
    },
    outline: {
      bg: 'transparent',
      borderColor: 'primary.500',
      color: 'primary.500',
      _focus: {
        boxShadow: '0 0 0 4px var(--chakra-colors-primary-300)',
      },
      _disabled: {
        borderColor: 'primary.400',
        color: 'primary.400',
        opacity: 1,
      },
      _hover: {
        bg: 'primary.100',
        _disabled: {
          bg: 'transparent',
        },
      },
    },
    clear: {
      bg: 'transparent',
      borderColor: 'transparent',
      color: 'secondary.500',
      _focus: {
        boxShadow: '0 0 0 4px var(--chakra-colors-secondary-300)',
      },
      _disabled: {
        color: 'secondary.300',
        opacity: 1,
      },
      _hover: {
        bg: 'secondary.100',
        _disabled: {
          bg: 'transparent',
        },
      },
    },
  } as Record<ThemeButtonVariants, ThemingPropsThunk<SystemStyleObject>>,
  defaultProps: {
    variant: 'primary',
  },
}
