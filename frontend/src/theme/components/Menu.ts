import { menuAnatomy as parts } from '@chakra-ui/anatomy'
import { getColor, PartsStyleFunction } from '@chakra-ui/theme-tools'

export type MenuVariant = 'outline' | 'clear'

const baseStyle: PartsStyleFunction<typeof parts> = (props) => {
  const { colorScheme: c, isStretch, theme, focusItemBorderColor: fc } = props
  return {
    button: {
      width: isStretch ? '100%' : undefined,
      textAlign: 'left',
      justifyContent: 'space-between',
      _hover: {
        color: `${c}.900`,
      },
      _active: {
        color: `${c}.500`,
        _hover: {
          color: `${c}.900`,
        },
      },
    },
    item: {
      padding: '0.75rem 1rem',
      fontWeight: '400',
      color: 'secondary.700',
      _hover: {
        bg: `${c}.100`,
        borderWidth: '0rem',
      },
      _focus: {
        bg: `${c}.100`,
        boxShadow: `0 0 0 2px ${getColor(theme, fc)}`,
        _active: {
          bg: `${c}.200`,
        },
      },
      _active: {
        bg: `${c}.200`,
        fontWeight: 500,
      },
      _disabled: {
        opacity: 0.6,
        bg: 'initial',
        _hover: {
          bg: 'initial',
        },
        _active: {
          fontWeight: 'initial',
        },
        cursor: 'not-allowed',
      },
    },
    list: {
      border: 'none',
      borderRadius: 0,
      minWidth: '0rem',
      shadow: 'var(--chakra-shadows-sm) !important',
    },
  }
}

const variantClear: PartsStyleFunction<typeof parts> = (_props) => {
  return {
    button: {
      minH: 'auto',
      outline: 'none',
      border: 'none',
      boxShadow: 'none',
    },
  }
}

const variantOutline: PartsStyleFunction<typeof parts> = ({
  colorScheme: c,
  theme,
}) => {
  return {
    button: {
      _hover: {
        borderColor: `${c}.900`,
      },
      _active: {
        boxShadow: `0 0 0 1px ${getColor(theme, `${c}.500`)}`,
        _hover: {
          boxShadow: `0 0 0 1px ${getColor(theme, `${c}.900`)}`,
        },
      },
    },
  }
}

const variants = {
  clear: variantClear,
  outline: variantOutline,
}

export const Menu = {
  parts: parts.keys,
  baseStyle,
  variants,
  defaultProps: {
    colorScheme: 'secondary',
    focusItemBorderColor: 'primary.500',
    variant: 'outline',
  },
}
