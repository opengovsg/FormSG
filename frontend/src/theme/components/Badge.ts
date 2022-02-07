import { SystemStyleFunction, SystemStyleObject } from '@chakra-ui/theme-tools'

import { textStyles } from '../textStyles'

export type BadgeVariants = 'solid' | 'subtle'

const baseStyle: SystemStyleObject = {
  ...textStyles['caption-1'],
  textTransform: 'initial',
}

const variantSolid: SystemStyleFunction = (props) => {
  const { colorScheme: c } = props
  const textColor = c === 'secondary' ? 'white' : 'secondary.700'

  return {
    color: textColor,
    bgColor: `${c}.400`,
  }
}
const variantSubtle: SystemStyleFunction = (props) => {
  const { colorScheme: c } = props
  const textColor = ['primary', 'secondary'].includes(c ?? '')
    ? `${c}.500`
    : `${c}.800`

  return {
    bgColor: `${c}.100`,
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
    colorScheme: 'primary',
  },
}
