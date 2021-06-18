import { CSSObject } from '@chakra-ui/styled-system'
import {
  ChakraTheme,
  ComponentStyleConfig,
  ThemingPropsThunk,
} from '@chakra-ui/theme'
import { getColor } from '@chakra-ui/theme-tools'

export const YESNO_THEME_KEY = 'YesNoField'

const baseStyle: ThemingPropsThunk<CSSObject, ChakraTheme> = (props) => {
  const { colorScheme: c, theme } = props

  const neutral500 = getColor(theme, 'neutral.500')
  const theme500 = getColor(theme, `${c}.500`)

  return {
    display: 'flex',
    transitionProperty: 'common',
    transitionDuration: 'normal',
    alignItems: 'center',
    cursor: 'pointer',
    textStyle: 'subhead-1',
    justifyContent: 'center',
    bg: 'neutral.100',
    border: `1px solid ${neutral500}`,
    p: '15px',
    _disabled: {
      bg: 'neutral.200',
      cursor: 'not-allowed',
      color: 'neutral.500',
      _active: {
        boxShadow: 'none',
        borderColor: 'neutral.500',
      },
      _hover: {
        bg: 'neutral.200',
      },
      _checked: {
        bg: 'neutral.300',
        boxShadow: `0 0 0 2px ${neutral500}`,
        borderColor: 'neutral.500',
        _hover: {
          bg: 'neutral.300',
        },
        _active: {
          borderColor: 'neutral.500',
        },
      },
    },
    _hover: {
      bg: `${c}.200`,
    },
    _active: {
      borderColor: `${c}.500`,
      boxShadow: `0 0 0 2px ${theme500}`,
    },
    _focus: {
      borderColor: `${c}.500`,
      boxShadow: `0 0 0 1px ${theme500}`,
    },
    _checked: {
      bg: `${c}.200`,
      borderColor: `${c}.500`,
      boxShadow: `0 0 0 2px ${theme500}`,
    },
  }
}

export const YesNoField: ComponentStyleConfig = {
  baseStyle,
  variants: {
    left: {
      borderRadius: '4px 0 0 4px',
    },
    right: {
      borderRadius: '0 4px 4px 0',
    },
  },
}
