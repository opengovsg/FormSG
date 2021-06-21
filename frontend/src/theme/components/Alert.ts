import {
  ChakraTheme,
  ComponentStyleConfig,
  CSSObject,
  ThemingPropsThunk,
} from '@chakra-ui/react'

const variantToast: ThemingPropsThunk<CSSObject, ChakraTheme> = (props) => {
  const { colorScheme: c } = props

  return {
    container: {
      bg: `${c}.100`,
      border: `1px solid var(--chakra-colors-${c}-500)`,
      borderRadius: '3px',
      boxSizing: 'border-box',
    },
    icon: {
      color: `${c}.500`,
    },
  }
}

export const Alert: ComponentStyleConfig = {
  variants: {
    toast: variantToast,
  },
}
