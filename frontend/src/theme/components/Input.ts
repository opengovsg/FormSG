import { inputAnatomy } from '@chakra-ui/anatomy'
import { getColor, StyleFunctionProps } from '@chakra-ui/theme-tools'

/**
 * Override with more if we have more sizes.
 */
const size = {
  md: {
    px: '1rem',
    h: '2.75rem',
    borderRadius: '0.25rem',
  },
}

const outlineVariant = (props: StyleFunctionProps) => {
  const {
    theme,
    focusBorderColor: fc,
    errorBorderColor: ec,
    isSuccess,
    isPrefilled,
  } = props

  return {
    field: {
      bg: isPrefilled ? 'warning.100' : 'white',
      border: '1px solid',
      borderColor: isSuccess ? 'success.700' : 'neutral.400',
      _hover: {
        borderColor: isSuccess ? 'success.700' : 'neutral.400',
      },
      _disabled: {
        borderColor: 'neutral.400',
      },
      _invalid: {
        // Remove extra 1px of outline.
        borderColor: getColor(theme, ec),
        boxShadow: 'none',
      },
      _focus: {
        borderColor: getColor(theme, fc),
        _hover: {
          borderColor: getColor(theme, fc),
        },
        boxShadow: `0 0 0 1px ${getColor(theme, fc)}`,
      },
    },
  }
}

// Additional success part.
const parts = inputAnatomy.extend('success')

export const Input = {
  parts: parts.keys,
  baseStyle: {
    field: {
      textStyle: 'body-1',
      _placeholder: {
        color: 'neutral.500',
      },
      _disabled: {
        bg: 'neutral.200',
        color: 'neutral.500',
        cursor: 'not-allowed',
        opacity: 1,
        _hover: {
          bg: 'neutral.200',
        },
        _active: {
          bg: 'neutral.200',
        },
      },
    },
    success: {
      pointerEvents: 'none',
      fontSize: '1.25rem',
      color: 'success.700',
    },
  },
  variants: {
    outline: outlineVariant,
  },
  sizes: {
    md: {
      field: size.md,
      addon: size.md,
    },
  },
  defaultProps: {
    variant: 'outline',
    size: 'md',
    focusBorderColor: 'primary.500',
    errorBorderColor: 'danger.500',
  },
}
