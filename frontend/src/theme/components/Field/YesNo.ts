import { CSSObject } from '@chakra-ui/styled-system'
import {
  ChakraTheme,
  ComponentStyleConfig,
  ThemingPropsThunk,
} from '@chakra-ui/theme'
import { getColor } from '@chakra-ui/theme-tools'

import { ThemeColorScheme } from '~theme/foundations/colours'

export const YESNO_THEME_KEY = 'YesNoField'
export type YesNoColorScheme = Extract<
  ThemeColorScheme,
  | 'primary'
  | 'theme-green'
  | 'theme-teal'
  | 'theme-purple'
  | 'theme-grey'
  | 'theme-yellow'
  | 'theme-orange'
  | 'theme-red'
  | 'theme-brown'
>

const baseStyle: ThemingPropsThunk<CSSObject, ChakraTheme> = (props) => {
  const { colorScheme: c = 'primary', theme } = props

  const isLighterTheme = ['theme-yellow', 'theme-orange', 'theme-red'].includes(
    c,
  )

  // Change colors according to colorScheme.
  const activeBgVar = c === 'primary' ? `${c}.200` : `${c}.300`
  const activeBorderColorVar = isLighterTheme ? `${c}.700` : `${c}.500`
  const focusBorderColorVar = isLighterTheme ? `${c}.700` : `${c}.500`

  const neutral500 = getColor(theme, 'neutral.500')
  const activeBg = getColor(theme, activeBgVar)
  const activeBorderColor = getColor(theme, activeBorderColorVar)
  const focusBorderColor = getColor(theme, focusBorderColorVar)

  return {
    display: 'flex',
    transitionProperty: 'common',
    transitionDuration: 'normal',
    alignItems: 'center',
    cursor: 'pointer',
    textStyle: 'subhead-1',
    justifyContent: 'center',
    color: 'secondary.700',
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
      bg: `${c}.100`,
    },
    _active: {
      bg: activeBg,
      borderColor: activeBorderColor,
      boxShadow: `0 0 0 2px ${activeBorderColor} inset`,
    },
    _focus: {
      borderColor: focusBorderColor,
      boxShadow: `0 0 0 1px ${focusBorderColor}`,
    },
    _checked: {
      bg: activeBg,
      borderColor: activeBorderColor,
      boxShadow: `0 0 0 2px ${activeBorderColor} inset`,
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
