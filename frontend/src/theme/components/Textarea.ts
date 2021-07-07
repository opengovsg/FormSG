/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ComponentStyleConfig } from '@chakra-ui/theme'

import { Input } from './Input'

export const Textarea: ComponentStyleConfig = {
  variants: {
    outline: (props) => {
      return {
        ...Input.variants.outline(props).field,
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
