import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

import { Input } from './Input'

const parts = ['field', 'iconContainer', 'icon']

export const SingleCountryPhoneNumberInput: ComponentMultiStyleConfig = {
  parts,
  variants: {
    outline: (props) => {
      const { isSuccess } = props
      const inputStyle = Input.variants.outline(props)

      return {
        field: {
          ...(isSuccess ? { paddingInlineEnd: '4.75rem' } : {}),
          ...inputStyle.field,
        },
        iconContainer: {
          pointerEvents: 'none',
          ...(isSuccess ? { mr: '2rem' } : {}),
          _disabled: {
            opacity: 0.6,
          },
        },
      }
    },
  },
  sizes: {
    md: {
      icon: {
        w: '1.5em',
      },
    },
  },
  defaultProps: {
    variant: 'outline',
    size: 'md',
    focusBorderColor: Input.defaultProps.focusBorderColor,
    errorBorderColor: Input.defaultProps.errorBorderColor,
  },
}
