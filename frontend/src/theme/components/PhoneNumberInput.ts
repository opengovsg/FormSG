import { anatomy, getColor } from '@chakra-ui/theme-tools'

import { ComponentMultiStyleConfig } from '~theme/types'

import { Input } from './Input'

const parts = anatomy('phonenumberinput').parts(
  'field',
  'country',
  'icon',
  'selector',
)

export const PhoneNumberInput: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  variants: {
    outline: (props) => {
      const inputStyle = Input.variants.outline(props)
      const { theme, focusBorderColor: fc } = props

      return {
        field: {
          ...inputStyle.field,
          borderLeftRadius: 0,
        },
        country: {
          transitionProperty: 'common',
          transitionDuration: 'normal',
          bg: 'white',
          border: '1px solid',
          borderColor: 'neutral.400',
          _disabled: {
            ...inputStyle.field?._disabled,
            cursor: 'not-allowed',

            _active: {
              borderColor: 'neutral.400',
              boxShadow: 'none',
            },
          },
          _active: {
            borderColor: getColor(theme, fc),
            boxShadow: `0 0 0 1px ${getColor(theme, fc)}`,
          },
          _focusWithin: {
            zIndex: 1,
            borderColor: getColor(theme, fc),
            boxShadow: `0 0 0 1px ${getColor(theme, fc)}`,
          },
          _hover: { bg: 'neutral.200' },
          pos: 'relative',
          p: '0.5rem',
          width: '4rem',
        },
        selector: {
          cursor: 'pointer',
          opacity: 0,
          pos: 'absolute',
          w: '100%',
          h: '100%',
          left: 0,
          top: 0,
          _disabled: {
            cursor: 'not-allowed',
          },
        },
        icon: {
          mr: '0.5rem',
          w: '1.5em',
          _disabled: {
            opacity: 0.6,
          },
        },
      }
    },
  },
  defaultProps: {
    variant: 'outline',
    size: 'md',
    focusBorderColor: Input.defaultProps.focusBorderColor,
    errorBorderColor: Input.defaultProps.errorBorderColor,
  },
}
