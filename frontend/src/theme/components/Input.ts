import { ComponentStyleConfig } from '@chakra-ui/react'
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

export const Input: ComponentStyleConfig = {
  variants: {
    outline: (props) => {
      const { theme } = props
      const { focusBorderColor: fc, errorBorderColor: ec } = props

      return {
        field: {
          textStyle: 'body-1',
          border: '1px solid',
          borderColor: 'neutral.400',
          _placeholder: {
            color: 'neutral.500',
          },
          _hover: {
            borderColor: 'neutral.400',
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
