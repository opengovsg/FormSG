import { tagAnatomy } from '@chakra-ui/anatomy'
import {
  getColor,
  PartsStyleFunction,
  PartsStyleObject,
  SystemStyleObject,
} from '@chakra-ui/theme-tools'

import { meetsWcagAaRatio } from '~theme/utils/contrast'

import { textStyles } from '../textStyles'

import { Badge } from './Badge'

const parts = tagAnatomy.extend('icon')

const baseStyleContainer: SystemStyleObject = {
  ...textStyles['body-2'],
  transitionProperty: 'common',
  transitionDuration: 'normal',
}

const baseStyleLabel: SystemStyleObject = {
  textStyle: 'body-2',
}

const baseStyleCloseButton: SystemStyleObject = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: '0',
  opacity: 1,
  _disabled: {
    opacity: 1,
    cursor: 'not-allowed',
    bg: 'transparent',
  },
  _hover: {
    opacity: 1,
    _disabled: {
      bg: 'transparent',
    },
  },
  _active: {
    opacity: 1,
    _disabled: {
      bg: 'transparent',
    },
  },
}

const baseStyle: PartsStyleObject<typeof parts> = {
  container: baseStyleContainer,
  label: baseStyleLabel,
  closeButton: baseStyleCloseButton,
}

const sizes: Record<string, PartsStyleObject<typeof parts>> = {
  md: {
    container: {
      minH: '2rem',
      borderRadius: '4px',
      px: '0.5rem',
      py: '0.25rem',
    },
    closeButton: {
      h: '1.5rem',
      w: '1.5rem',
      marginStart: '0.25rem',
    },
    icon: {
      fontSize: '1.25rem',
      marginStart: '0.25rem',
      marginEnd: '0.25rem',
    },
  },
}

const variantSubtle: PartsStyleFunction<typeof parts> = (props) => {
  const { colorScheme: c } = props
  const badgeSubtleVariant = Badge.variants.subtle(props)
  return {
    container: {
      ...badgeSubtleVariant,
      _disabled: {
        color: 'neutral.500',
        cursor: 'not-allowed',
      },
      _hover: {
        bgColor: `${c}.200`,
        _disabled: {
          bgColor: badgeSubtleVariant.bgColor,
        },
      },
      _active: {
        bgColor: `${c}.300`,
        _disabled: {
          bgColor: badgeSubtleVariant.bgColor,
        },
      },
      _focus: {
        boxShadow: `0 0 0 2px var(--chakra-colors-${c}-300)`,
        _disabled: {
          boxShadow: 'none',
        },
      },
    },
    closeButton: {
      _focus: {
        boxShadow: `0 0 0 2px var(--chakra-colors-${c}-300)`,
      },
      _hover: {
        color: `${c}.600`,
        _disabled: {
          color: 'neutral.500',
        },
      },
      _active: {
        color: `${c}.700`,
        _disabled: {
          color: 'neutral.500',
        },
      },
      _disabled: {
        color: 'neutral.500',
      },
    },
  }
}

const variantSolid: PartsStyleFunction<typeof parts> = (props) => {
  const { colorScheme: c, theme } = props
  const bgColor = getColor(theme, `${c}.500`)
  let textColor = getColor(theme, 'secondary.700')
  const hasSufficientContrast = meetsWcagAaRatio(textColor, bgColor)
  if (!hasSufficientContrast) {
    textColor = 'white'
  }
  const badgeSolidVariant = Badge.variants.solid(props)
  return {
    container: {
      ...badgeSolidVariant,
      bgColor,
      color: textColor,
      _disabled: {
        bg: `${c}.300`,
        cursor: 'not-allowed',
      },
      _hover: {
        bgColor: `${c}.600`,
        _disabled: {
          bgColor: `${c}.300`,
        },
      },
      _active: {
        bgColor: `${c}.700`,
        _disabled: {
          bgColor: `${c}.300`,
        },
      },
      _focus: {
        boxShadow: `0 0 0 2px var(--chakra-colors-${c}-200)`,
        _disabled: {
          boxShadow: 'none',
        },
      },
    },
    closeButton: {
      _focus: {
        boxShadow: `0 0 0 2px var(--chakra-colors-${c}-300)`,
      },
    },
  }
}

const variants = {
  subtle: variantSubtle,
  solid: variantSolid,
}

export const Tag = {
  parts: parts.keys,
  baseStyle,
  variants,
  sizes,
  defaultProps: {
    size: 'md',
    variant: 'subtle',
    colorScheme: 'primary',
  },
}
