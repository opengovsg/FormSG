import { anatomy, PartsStyleFunction } from '@chakra-ui/theme-tools'
import { merge, pick } from 'lodash'

import { Checkbox } from './Checkbox'
import { Input } from './Input'
import { comboboxParts, SingleSelect } from './SingleSelect'

export const parts = anatomy('multiselect').parts(
  ...comboboxParts.keys,
  'field',
  'fieldwrapper',
  'itemcheckbox',
)

const baseStyle: PartsStyleFunction<typeof parts> = (props) => {
  const comboboxBaseStyle = pick(
    SingleSelect.baseStyle(props),
    comboboxParts.keys,
  )
  return {
    ...comboboxBaseStyle,
    fieldwrapper: {
      display: 'flex',
      flexWrap: 'wrap',
      p: '0.375rem',
      minH: '2.75rem',
      cursor: 'pointer',
    },
    field: {
      h: '2rem',
      flexGrow: 1,
      minW: '3.75rem',
      w: 0,
      px: '2px',
      my: '2px',
      alignSelf: 'center',
      ':first-child': {
        pl: '0.5rem',
      },
      ':focus-visible': {
        outline: 'none',
      },
    },
    itemcheckbox: merge(Checkbox.baseStyle(props).control, {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      verticalAlign: 'top',
      userSelect: 'none',
      flexShrink: 0,
    }),
  }
}

const variantOutline: PartsStyleFunction<typeof parts> = (props) => {
  const comboboxVariantOutline = pick(
    SingleSelect.variants.outline(props),
    comboboxParts.keys,
  )
  const inputFieldVariantOutline = Input.variants.outline(props).field

  const { isFocused } = props

  return {
    ...comboboxVariantOutline,
    fieldwrapper: {
      borderRadius: '4px',
      ...inputFieldVariantOutline,
      ...(isFocused ? inputFieldVariantOutline._focus : {}),
    },
  }
}

const variants = {
  outline: variantOutline,
}

export const MultiSelect = {
  parts: parts.keys,
  baseStyle,
  variants,
  sizes: SingleSelect.sizes,
  defaultProps: SingleSelect.defaultProps,
}
