import {
  getColor,
  SystemStyleFunction,
  SystemStyleObject,
} from '@chakra-ui/theme-tools'

import { meetsWcagAaRatio } from '~theme/utils/contrast'

import { textStyles } from '../textStyles'

export type BadgeVariants = 'solid' | 'subtle'

const baseStyle: SystemStyleObject = {
  ...textStyles['caption-1'],
  textTransform: 'initial',
}

const variantSolid: SystemStyleFunction = (props) => {
  const { colorScheme: c, theme } = props
  const bgColor = getColor(theme, `${c}.400`)
  let textColor = getColor(theme, 'brand.secondary.700')
  const hasSufficientContrast = meetsWcagAaRatio(textColor, bgColor)
  if (!hasSufficientContrast) {
    textColor = 'white'
  }

  return {
    color: textColor,
    bgColor,
  }
}
const variantSubtle: SystemStyleFunction = (props) => {
  const { colorScheme: c, theme } = props

  const bgColor = getColor(theme, `${c}.100`)
  let textColor = getColor(theme, `${c}.500`)
  const hasSufficientContrast = meetsWcagAaRatio(textColor, bgColor)
  if (!hasSufficientContrast) {
    textColor = `${c}.800`
  }

  return {
    bgColor,
    color: textColor,
  }
}

const variants = {
  solid: variantSolid,
  subtle: variantSubtle,
}

const sizes: Record<string, SystemStyleObject> = {
  md: {
    py: '0.25rem',
    px: '0.5rem',
    borderRadius: '4px',
  },
}

export const Badge = {
  baseStyle,
  variants,
  sizes,
  defaultProps: {
    variant: 'solid',
    size: 'md',
    colorScheme: 'main',
  },
}
