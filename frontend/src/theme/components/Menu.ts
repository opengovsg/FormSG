import { menuAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers, cssVar } from '@chakra-ui/react'
import { StyleFunctionProps } from '@chakra-ui/theme-tools'

const parts = menuAnatomy.extend('chevron')

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(parts.keys)

const $bg = cssVar('menu-bg')
const $shadow = cssVar('menu-shadow')

const getListItemColors = ({ colorScheme: c }: StyleFunctionProps) => {
  return {
    hoverBg: `${c}.100`,
    activeBg: `${c}.200`,
  }
}

const baseStyle = definePartsStyle((props) => {
  const { hoverBg, activeBg } = getListItemColors(props)

  return {
    button: {
      textAlign: 'left',
      justifyContent: 'space-between',
    },
    list: {
      mt: '0.5rem',
      border: 'none',
      borderRadius: 0,
      minWidth: '0rem',
      [$shadow.variable]: 'shadows.sm',
      [$bg.variable]: 'white',
      boxShadow: $shadow.reference,
    },
    item: {
      padding: '0.75rem 1rem',
      // Required for items to also have variable colors
      bg: $bg.reference,
      [$bg.variable]: 'white',
      textStyle: 'body-1',
      fontWeight: '400',
      color: 'secondary.700',
      _hover: {
        [$bg.variable]: `colors.${hoverBg}`,
      },
      _disabled: {
        color: 'secondary.300',
        opacity: 1,
        cursor: 'not-allowed',
      },
      _focus: {
        [$bg.variable]: `colors.${hoverBg}`,
        _active: {
          [$bg.variable]: `colors.${activeBg}`,
        },
      },
      _focusVisible: {
        boxShadow: `0 0 0 2px var(--chakra-colors-primary-500)`,
        _active: {
          [$bg.variable]: `colors.${activeBg}`,
        },
      },
      _active: {
        [$bg.variable]: `colors.${activeBg}`,
      },
    },
    divider: {
      borderColor: 'secondary.100',
      opacity: 1,
      my: 0,
    },
  }
})

const getClearButtonColors = ({ colorScheme: c }: StyleFunctionProps) => {
  return {
    color: `${c}.500`,
    hoverColor: `${c}.600`,
    activeColor: `${c}.700`,
  }
}

const variantClear = definePartsStyle((props) => {
  const { color, hoverColor, activeColor } = getClearButtonColors(props)
  return {
    button: {
      bg: 'transparent',
      color,
      _hover: {
        color: hoverColor,
      },
      _active: {
        color: activeColor,
      },
    },
  }
})

const variants = {
  clear: variantClear,
  outline: {},
}

const sizes = {
  sm: definePartsStyle({
    chevron: {
      fontSize: '1.25rem',
    },
    item: {
      textStyle: 'subhead-2',
      padding: '0.625rem 0.75rem',
    },
  }),
  md: definePartsStyle({
    chevron: {
      fontSize: '1.25rem',
    },
    item: {
      textStyle: 'body-1',
      padding: '0.75rem 1rem',
    },
  }),
}

export const Menu = defineMultiStyleConfig({
  baseStyle,
  sizes,
  variants,
  defaultProps: {
    colorScheme: 'secondary',
    variant: 'outline',
    size: 'md',
  },
})
