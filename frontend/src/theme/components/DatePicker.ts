import { anatomy, PartsStyleFunction } from '@chakra-ui/theme-tools'

import { ComponentMultiStyleConfig } from '~theme/types'

import { Input } from './Input'

const parts = anatomy('datepicker').parts('fieldwrapper', 'field')

const variantOutline: PartsStyleFunction<typeof parts> = (props) => {
  const inputFieldVariantOutline = Input.variants.outline(props).field

  return {
    fieldwrapper: {
      cursor: 'text',
      flex: 1,
      zIndex: 1,
      px: '1rem',
      borderLeftRadius: '4px',
      borderRightRadius: 0,
      transitionProperty: 'common',
      transitionDuration: 'normal',
      _focusWithin: inputFieldVariantOutline._focus,
      ...inputFieldVariantOutline,
    },
    field: {
      _disabled: {
        cursor: 'not-allowed',
      },
      transitionProperty: 'common',
      transitionDuration: 'normal',
      display: 'flex',
      flex: 1,
    },
  }
}

const variants = {
  outline: variantOutline,
}

export const DatePicker: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  variants,
  defaultProps: {
    variant: 'outline',
    colorScheme: 'primary',
    size: 'md',
    focusBorderColor: Input.defaultProps.focusBorderColor,
    errorBorderColor: Input.defaultProps.errorBorderColor,
  },
}
