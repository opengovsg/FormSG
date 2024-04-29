import { createMultiStyleConfigHelpers, cssVar } from '@chakra-ui/react'
import { anatomy } from '@chakra-ui/theme-tools'

import { Input } from './Input'

const $height = cssVar('input-height')

// This numberinput component anatomy is distinct from the one in ChakraUI's
// core library.
const parts = anatomy('numberinput').parts(
  'root',
  'field',
  'stepper',
  'stepperButton',
  'stepperWrapper',
  'stepperDivider',
)

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys)

const baseStyle = definePartsStyle({
  root: {
    position: 'relative',
    zIndex: 0,
  },
  stepperWrapper: {
    height: [$height.reference],
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    pos: 'absolute',
    right: 0,
    top: 0,
    border: '1px solid transparent',
  },
  stepperButton: {
    color: 'secondary.500',
    borderRadius: 0,
    minH: '100%',
    _disabled: {
      color: 'neutral.500',
      cursor: 'not-allowed',
    },
    _last: {
      borderRightRadius: '4px',
    },
  },
})

const sizes = {
  md: definePartsStyle({
    stepper: {
      fontSize: '1rem',
    },
    stepperWrapper: {
      h: Input.sizes?.md.field[$height.variable],
    },
    field: Input.sizes?.md.field,
    stepperDivider: {
      h: '1.25rem',
    },
  }),
}

const variantOutline = definePartsStyle((props) => ({
  field: Input.variants?.outline(props).field,
}))

const variants = {
  outline: variantOutline,
}

export const NumberInput = defineMultiStyleConfig({
  baseStyle,
  sizes,
  variants: variants,
  defaultProps: Input.defaultProps,
})
