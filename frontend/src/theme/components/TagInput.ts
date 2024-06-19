import {
  anatomy,
  PartsStyleFunction,
  PartsStyleObject,
} from '@chakra-ui/theme-tools'

import { Input } from './Input'

export const parts = anatomy('taginput').parts('container', 'field')

const baseStyle: PartsStyleFunction<typeof parts> = (props) => {
  return {
    container: {
      display: 'flex',
      flexWrap: 'wrap',
      cursor: 'text',
      height: 'auto',
      maxW: '100%',
      w: '100%',
      _disabled: {
        cursor: 'not-allowed',
      },
      transitionProperty: 'common',
      transitionDuration: 'normal',
    },
    field: {
      flexGrow: 1,
      _disabled: {
        cursor: 'not-allowed',
      },
      _placeholder: {
        color: 'neutral.500',
      },
    },
  }
}

const variantOutline: PartsStyleFunction<typeof parts> = (props) => {
  const inputFieldVariantOutline = Input.variants.outline(props).field

  return {
    container: {
      borderRadius: '4px',
      _focusWithin: inputFieldVariantOutline._focus,
      ...inputFieldVariantOutline,
    },
  }
}

const sizes: Record<string, PartsStyleObject<typeof parts>> = {
  md: {
    container: {
      p: '0.375rem',
      minH: '2.75rem',
      gap: '0.25rem',
    },
    field: {
      py: '0.25rem',
      pl: '0.5rem',
    },
  },
}

export const TagInput = {
  parts: parts.keys,
  baseStyle,
  variants: {
    outline: variantOutline,
  },
  sizes,
  defaultProps: {
    size: 'md',
    variant: 'outline',
    focusBorderColor: Input.defaultProps.focusBorderColor,
    errorBorderColor: Input.defaultProps.errorBorderColor,
    colorScheme: 'primary',
  },
}
