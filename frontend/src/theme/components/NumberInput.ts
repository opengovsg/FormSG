import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

import { Input } from './Input'

const parts = ['root', 'field', 'success', 'stepper', 'stepperGroup']

/**
 * CSS variable string that refers to the right input field padding to
 * accomodate the number stepper.
 *
 * See https://github.com/chakra-ui/chakra-ui/blob/main/packages/theme/src/components/number-input.ts#L10.
 */
const SX_FIELD_PADDING = '--number-input-field-padding'
/**
 * CSS variable string that refers to the width of the current stepper.
 */
const SX_STEPPER_WIDTH = '--number-input-stepper-width'

const baseStyleRoot = {
  [SX_STEPPER_WIDTH]: '2.75rem',
  [SX_FIELD_PADDING]: `var(${SX_STEPPER_WIDTH})`,
}

const baseStyleStepper = (_props: Record<string, any>) => {
  return {
    border: 'none',
    color: 'neutral.400',
    _active: {
      bg: 'neutral.200',
    },
    _disabled: {
      opacity: 1,
      cursor: 'not-allowed',
    },
    _hover: {
      color: 'neutral.600',
    },
    _first: {
      alignItems: 'flex-end',
    },
    _last: {
      alignItems: 'flex-start',
    },
  }
}

export const NumberInput: ComponentMultiStyleConfig = {
  parts,
  baseStyle: (props) => ({
    root: baseStyleRoot,
    stepper: baseStyleStepper(props),
  }),
  sizes: {
    md: {
      stepper: {
        fontSize: '1rem',
      },
    },
  },
  variants: {
    ...Input.variants,
    outline: (props: Record<string, any>) => {
      const { isSuccess } = props
      const inputOutlineStyles = Input.variants.outline(props)

      return {
        ...inputOutlineStyles,
        field: {
          ...inputOutlineStyles.field,
          paddingInlineEnd: isSuccess
            ? `calc(var(${SX_STEPPER_WIDTH}) + 2.5rem)`
            : undefined,
        },
        success: {
          ...inputOutlineStyles.success,
          mr: `var(${SX_STEPPER_WIDTH})`,
        },
      }
    },
  },
  defaultProps: Input.defaultProps,
}
