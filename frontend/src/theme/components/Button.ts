import {
  ChakraTheme,
  ComponentStyleConfig,
  CSSObject,
  SystemStyleObject,
  ThemingPropsThunk,
} from '@chakra-ui/react'

export type ThemeButtonVariant = 'solid' | 'reverse' | 'outline' | 'clear'

const variantSolid: ThemingPropsThunk<CSSObject, ChakraTheme> = (props) => {
  const { colorScheme: c } = props
  let bg = `${c}.500`
  let activeBg = `${c}.700`
  let hoverBg = `${c}.600`
  let focusBoxShadow = `0 0 0 4px var(--chakra-colors-${c}-300)`

  if (c === 'success') {
    bg = `${c}.700`
    activeBg = `${c}.800`
    hoverBg = `${c}.800`
    focusBoxShadow = `0 0 0 4px var(--chakra-colors-${c}-400)`
  }

  return {
    bg,
    borderColor: 'transparent',
    color: 'white',
    _active: {
      bg: activeBg,
      _disabled: {
        bg: `${c}.300`,
      },
    },
    _focus: {
      borderColor: 'transparent',
      boxShadow: focusBoxShadow,
    },
    _disabled: {
      bg: `${c}.300`,
      opacity: 1,
    },
    _hover: {
      bg: hoverBg,
      _disabled: {
        bg: `${c}.300`,
      },
    },
  }
}

const variantClear: ThemingPropsThunk<CSSObject, ChakraTheme> = (props) => {
  const { colorScheme: c } = props

  return {
    bg: 'transparent',
    borderColor: 'transparent',
    color: `${c}.500`,
    _focus: {
      boxShadow: `0 0 0 4px var(--chakra-colors-${c}-300)`,
    },
    _disabled: {
      color: `${c}.300`,
      opacity: 1,
    },
    _active: {
      bg: `${c}.200`,
      _disabled: {
        bg: 'transparent',
      },
    },
    _hover: {
      bg: `${c}.100`,
      _disabled: {
        bg: 'transparent',
      },
    },
  }
}

const variantReverse: ThemingPropsThunk<CSSObject, ChakraTheme> = (props) => {
  const { colorScheme: c } = props

  return {
    bg: 'white',
    borderColor: 'transparent',
    color: `${c}.500`,
    _focus: {
      boxShadow: `0 0 0 4px var(--chakra-colors-${c}-300)`,
    },
    _disabled: {
      color: `${c}.400`,
      bg: 'white',
      opacity: 1,
    },
    _active: {
      bg: `${c}.200`,
      _disabled: {
        bg: 'white',
      },
    },
    _hover: {
      bg: `${c}.100`,
      _disabled: {
        bg: 'white',
      },
    },
  }
}

const variantOutline: ThemingPropsThunk<CSSObject, ChakraTheme> = (props) => {
  const { colorScheme: c } = props

  const reverseStyle = variantReverse(props)

  return {
    ...reverseStyle,
    borderColor: `${c}.500`,
    _disabled: {
      color: `${c}.400`,
      bg: 'white',
      opacity: 1,
      borderColor: `${c}.400`,
    },
  }
}

export const Button: ComponentStyleConfig = {
  baseStyle: {
    borderRadius: '4px',
    border: '1px solid',
    textStyle: 'subhead-1',
    fontWeight: 'medium',
    px: '0.5rem',
    py: '1rem',
  },
  sizes: {
    md: {
      minH: '2.75rem',
      minW: '2.75rem',
    },
    lg: {
      minH: '3rem',
      minW: '3rem',
    },
  },
  variants: {
    solid: variantSolid,
    reverse: variantReverse,
    outline: variantOutline,
    clear: variantClear,
  } as Record<ThemeButtonVariant, ThemingPropsThunk<SystemStyleObject>>,
  defaultProps: {
    variant: 'primary',
    colorScheme: 'primary',
    size: 'md',
  },
}
