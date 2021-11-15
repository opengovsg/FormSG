/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ThemeComponentProps } from '@chakra-ui/theme'
import { getColor } from '@chakra-ui/theme-tools'

export const Link = {
  baseStyle: ({ colorScheme: c = 'primary', theme }: ThemeComponentProps) => {
    let linkColor = `${c}.500`
    let hoverColor = `${c}.600`

    // Special cases for accessibility.
    if (c === 'warning') {
      linkColor = `${c}.800`
      hoverColor = `${c}.900`
    } else if (
      ['success', 'neutral', 'theme-yellow', 'theme-orange'].includes(c)
    ) {
      linkColor = `${c}.700`
      hoverColor = `${c}.800`
    }

    return {
      position: 'relative',
      color: linkColor,
      borderRadius: '0.25rem',
      _hover: {
        color: hoverColor,
        _disabled: {
          color: `${c}.300`,
        },
      },
      _disabled: {
        color: `${c}.300`,
        cursor: 'not-allowed',
      },
      _focus: {
        boxShadow: `0 0 0 2px ${getColor(theme, linkColor)}`,
      },
    }
  },
  variants: {
    inline: {
      textDecorationLine: 'underline',
      textUnderlineOffset: '0.125rem',
    },
    standalone: {
      p: '0.25rem',
      textUnderlineOffset: '0.125rem',
      _hover: {
        textDecorationLine: 'underline',
      },
    },
  },
  defaultProps: {
    variant: 'inline',
    colorScheme: 'primary',
  },
}
