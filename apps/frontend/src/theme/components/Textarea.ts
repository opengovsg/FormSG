import { StyleFunctionProps } from '@chakra-ui/theme-tools'

import { Input } from './Input'

export const Textarea = {
  variants: {
    // oxlint-disable-next-line typescript/explicit-module-boundary-types
    outline: (props: StyleFunctionProps) => {
      return {
        ...Input.variants.outline(props).field,
        transitionProperty: 'common',
        transitionDuration: 'normal',
        py: '0.5rem',
      }
    },
    highContrast: (props: StyleFunctionProps) => {
      return {
        ...Input.variants.highContrast(props).field,
        transitionProperty: 'common',
        transitionDuration: 'normal',
        py: '0.5rem',
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
