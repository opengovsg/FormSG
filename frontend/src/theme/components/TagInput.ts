import { createMultiStyleConfigHelpers } from '@chakra-ui/react'
import { anatomy } from '@chakra-ui/theme-tools'

import { $borderRadius, $height, Input } from './Input'

export const parts = anatomy('taginput').parts('container', 'field')

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys)

const baseStyle = definePartsStyle({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    cursor: 'text',
    height: 'auto',
    minH: [$height.reference],
    borderRadius: [$borderRadius.reference],
    maxW: '100%',
    w: '100%',
    _disabled: {
      cursor: 'not-allowed',
    },
    transitionProperty: 'common',
    transitionDuration: 'normal',
  },
  field: {
    _focusVisible: {
      outline: 'none',
    },
    flexGrow: 1,
    _disabled: {
      cursor: 'not-allowed',
    },
    _placeholder: {
      color: 'neutral.500',
    },
  },
})

const variantOutline = definePartsStyle((props) => {
  const inputFieldVariantOutline = Input.variants?.outline(props).field

  return {
    container: {
      ...inputFieldVariantOutline,
      _focusWithin: {
        ...inputFieldVariantOutline?._focus,
      },
      h: 'auto',
    },
  }
})

const sizes = {
  md: definePartsStyle(() => {
    const mdInputFieldProps = Input.sizes?.md.field
    return {
      container: {
        ...mdInputFieldProps,
        p: 'calc(0.5rem - 2px)',
        minH: mdInputFieldProps?.h,
        gap: '0.25rem',
      },
      field: {
        h: '1.75rem',
        pl: '0.5rem',
      },
    }
  }),
}

export const TagInput = defineMultiStyleConfig({
  baseStyle,
  variants: {
    outline: variantOutline,
  },
  sizes,
  defaultProps: {
    size: 'md',
    variant: 'outline',
    // @ts-expect-error defineMultiStyleConfig does not have types for focus color props
    focusBorderColor: Input.defaultProps.focusBorderColor,
    errorBorderColor: Input.defaultProps.errorBorderColor,
    colorScheme: 'primary',
  },
})
