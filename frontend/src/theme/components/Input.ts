/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { getColor } from '@chakra-ui/theme-tools'

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

export const Input = {
  parts: ['field', 'addon', 'success'],
  variants: {
    outline: (props: Record<string, any>) => {
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
            background: 'neutral.200',
            borderColor: 'neutral.400',
            color: 'neutral.500',
            cursor: 'not-allowed',
            opacity: 1,
          },
          _invalid: {
            // Remove extra 1px of outline.
            borderColor: getColor(theme, ec),
            boxShadow: 'none',
          },
          _focus: {
            borderColor: getColor(theme, fc),
            boxShadow: `0 0 0 1px ${getColor(theme, fc)}`,
          },
        },
        success: {
          pointerEvents: 'none',
          fontSize: '1.25rem',
          color: 'success.700',
        },
      }
    },
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
