import { tagAnatomy } from '@chakra-ui/anatomy'
import {
  PartsStyleInterpolation,
  PartsStyleObject,
  SystemStyleObject,
} from '@chakra-ui/theme-tools'

import { ComponentMultiStyleConfig } from '~theme/types'

import { textStyles } from '../textStyles'

import { Badge } from './Badge'

const parts = tagAnatomy.extend('icon')

const baseStyleContainer: SystemStyleObject = {
  ...textStyles['body-2'],
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
    color: 'neutral.500',
    opacity: 1,
    cursor: 'not-allowed',
    bg: 'transparent',
  },
  _hover: {
    opacity: 1,
    _disabled: {
      color: 'neutral.500',
      bg: 'transparent',
    },
  },
  _active: {
    opacity: 1,
    _disabled: {
      color: 'neutral.500',
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

const variants: Record<string, PartsStyleInterpolation<typeof parts>> = {
  subtle: (props) => {
    const { colorScheme: c } = props
    return {
      container: Badge.variants.subtle(props),
      closeButton: {
        _focus: {
          boxShadow: `0 0 0 2px var(--chakra-colors-${c}-300)`,
        },
        _hover: {
          color: `${c}.600`,
        },
        _active: {
          color: `${c}.700`,
        },
      },
    }
  },
  solid: (props) => {
    const { colorScheme: c } = props
    return {
      container: {
        ...Badge.variants.solid(props),
        bgColor: `${c}.500`,
      },
      closeButton: {
        _focus: {
          boxShadow: `0 0 0 2px var(--chakra-colors-${c}-300)`,
        },
      },
    }
  },
}

export const Tag: ComponentMultiStyleConfig<typeof parts> = {
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
