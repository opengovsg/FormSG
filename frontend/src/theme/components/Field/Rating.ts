import { ComponentMultiStyleConfig } from '@chakra-ui/theme'
import { getColor } from '@chakra-ui/theme-tools'

export const RATING_THEME_KEY = 'RatingField'
const parts = ['option']

const getOptionThemeColor = (colorScheme: string) => {
  switch (colorScheme) {
    case 'theme-red':
    case 'theme-orange':
    case 'theme-yellow':
      return `${colorScheme}.700`
    default:
      return `${colorScheme}.500`
  }
}

const numberOptionStyle = (props: Record<string, any>) => {
  const { colorScheme: c } = props
  const themeColor = getOptionThemeColor(c)

  return {
    minW: '3.25rem',
    bg: 'white',
    borderWidth: '1px',
    py: '0.625rem',
    px: '0.875rem',
    borderColor: themeColor,
    color: themeColor,
    _disabled: {
      borderColor: 'neutral.500',
      color: 'neutral.500',
      cursor: 'not-allowed',
      _checked: {
        bg: 'neutral.500',
        _hover: {
          bg: 'neutral.500',
        },
        _active: {
          bg: 'neutral.500',
          color: 'white',
        },
      },
      _hover: {
        bg: 'white',
      },
      _active: {
        color: 'neutral.500',
        bg: 'white',
      },
    },
    _hover: {
      bg: `${c}.200`,
    },
    _active: {
      bg: themeColor,
      color: 'white',
    },
    _focus: {
      boxShadow: `0 0 0 4px var(--chakra-colors-${c}-300)`,
    },
    _checked: {
      bg: themeColor,
      color: 'white',
    },
  }
}

const iconOptionStyle = (props: Record<string, any>) => {
  const { colorScheme: c, theme } = props
  const themeColor = getOptionThemeColor(c)

  return {
    p: '0.125rem',
    borderRadius: '0.25rem',
    color: themeColor,
    _focus: {
      boxShadow: `0 0 0 2px ${getColor(theme, themeColor)}`,
    },
    _hover: {
      color: `${c}.700`,
    },
    _disabled: {
      borderColor: 'neutral.500',
      color: 'neutral.500',
      cursor: 'not-allowed',
      _active: {
        color: 'neutral.500',
      },
    },
  }
}

export const RatingField: ComponentMultiStyleConfig = {
  parts,
  baseStyle: {
    option: {
      display: 'flex',
      justifyContent: 'center',
      transitionProperty: 'common',
      transitionDuration: 'normal',
      cursor: 'pointer',
    },
  },
  variants: {
    number: (props) => ({
      option: numberOptionStyle(props),
    }),
    icon: (props) => ({
      option: iconOptionStyle(props),
    }),
  },
  defaultProps: {
    colorScheme: 'primary',
  },
}
