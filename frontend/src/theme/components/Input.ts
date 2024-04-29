import { inputAnatomy } from '@chakra-ui/anatomy'
import {
  createMultiStyleConfigHelpers,
  cssVar,
  defineStyle,
} from '@chakra-ui/react'
import { getColor, StyleFunctionProps } from '@chakra-ui/theme-tools'

// Additional success part.
const parts = inputAnatomy.extend('success')

export const $height = cssVar('input-height')
export const $padding = cssVar('input-padding')
export const $borderRadius = cssVar('input-border-radius')

const { definePartsStyle } = createMultiStyleConfigHelpers(parts.keys)

/**
 * Override with more if we have more sizes.
 */
const size = {
  md: defineStyle({
    [$padding.variable]: '1rem',
    [$height.variable]: '2.75rem',
    [$borderRadius.variable]: '4px',
  }),
}

const sizes = {
  md: definePartsStyle({
    element: size.md,
    field: size.md,
    addon: size.md,
  }),
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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
      bg: 'white',
      textStyle: 'body-1',
      border: '1px solid',
      borderColor: isSuccess ? 'success.700' : 'neutral.400',
      _placeholder: {
        color: 'neutral.500',
      },
      _hover: {
        borderColor: isSuccess ? 'success.700' : 'neutral.400',
      },
      _disabled: {
        bg: 'neutral.200',
        borderColor: 'neutral.400',
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
      _invalid: {
        // Remove extra 1px of outline.
        borderColor: getColor(theme, ec),
        boxShadow: 'none',
      },
      _focus: {
        _hover: {
          borderColor: getColor(theme, fc),
        },
        _invalid: {
          borderColor: getColor(theme, fc),
          boxShadow: `0 0 0 1px ${getColor(theme, fc)}`,
        },
        _disabled: {
          _hover: {
            borderColor: 'neutral.400',
          },
          bg: 'neutral.200',
          borderColor: 'neutral.400',
          boxShadow: 'none',
        },
        borderColor: getColor(theme, fc),
        boxShadow: `0 0 0 1px ${getColor(theme, fc)}`,
      },
      ...(isPrefilled
        ? {
            bg: 'warning.100',
            _disabled: {
              bg: 'warning.100',
            },
            _hover: {
              bg: 'warning.100',
            },
            _active: {
              bg: 'warning.100',
            },
          }
        : {}),
    },
    success: {
      pointerEvents: 'none',
      fontSize: '1.25rem',
      color: 'success.700',
    },
  }
}

export const Input = {
  variants: {
    outline: outlineVariant,
  },
  sizes,
  defaultProps: {
    variant: 'outline',
    size: 'md',
    focusBorderColor: 'primary.500',
    errorBorderColor: 'danger.500',
  },
}
