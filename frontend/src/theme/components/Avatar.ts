import { avatarAnatomy as parts } from '@chakra-ui/anatomy'
import { ThemingProps } from '@chakra-ui/react'
import { PartsStyleFunction, SystemStyleObject } from '@chakra-ui/theme-tools'

import { textStyles } from '../textStyles'

const baseStyle: PartsStyleFunction<typeof parts> = ({ colorScheme: c }) => {
  return {
    container: {
      bg: `${c}.500`,
      color: 'white',
      textStyle: 'subhead-2',
    },
    badge: {
      bg: 'danger.500',
      border: '1px solid white',
      transform: 'none',
    },
  }
}

const getBadgePlacement = (size: ThemingProps['size']): SystemStyleObject => {
  switch (size) {
    // Update width and height calculation in the future if needed.
    default:
      return {
        botton: '1px',
        right: '1px',
        borderWidth: '1px',
        // 20% of container width + 1px border left right.
        w: 'calc(20% + 2px)',
        h: 'calc(20% + 2px)',
      }
  }
}

const sizes = {
  xs: { badge: getBadgePlacement('xs') },
  sm: { badge: getBadgePlacement('sm') },
  md: {
    container: {
      width: '2.5rem',
      height: '2.5rem',
      fontSize: textStyles['subhead-2'].fontSize,
    },
    label: textStyles['subhead-2'],
    badge: getBadgePlacement('md'),
  },
  lg: { badge: getBadgePlacement('lg') },
  xl: { badge: getBadgePlacement('xl') },
}

export const Avatar = {
  parts: parts.keys,
  sizes,
  baseStyle,
  defaultProps: {
    size: 'md',
    colorScheme: 'primary',
  },
}
