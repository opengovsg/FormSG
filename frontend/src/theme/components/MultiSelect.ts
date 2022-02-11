import { anatomy, PartsStyleFunction } from '@chakra-ui/theme-tools'
import { pick } from 'lodash'

import { comboboxParts, SingleSelect } from './SingleSelect'

export const parts = anatomy('multiselect').parts(
  ...comboboxParts.keys,
  'fieldwrapper',
)

const baseStyle: PartsStyleFunction<typeof parts> = (props) => {
  const comboboxBaseStyle = pick(
    SingleSelect.baseStyle(props),
    comboboxParts.keys,
  )
  return {
    ...comboboxBaseStyle,
  }
}

const variantOutline: PartsStyleFunction<typeof parts> = (props) => {
  const comboboxVariantOutline = pick(
    SingleSelect.variants.outline(props),
    comboboxParts.keys,
  )

  return {
    ...comboboxVariantOutline,
    fieldwrapper: {},
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
