import { ComponentMultiStyleConfig } from '@chakra-ui/react'
import { getColor } from '@chakra-ui/theme-tools'

/**
 * This must be kept in line with the key from Chakra's internal
 * styling to ensure that the styles are merged correctly.
 * https://github.com/chakra-ui/chakra-ui/blob/main/packages/theme/src/components/index.ts
 */
export const RADIO_THEME_KEY = 'Radio'

/**
 * With reference to
 * https://github.com/chakra-ui/chakra-ui/blob/main/packages/theme/src/components/radio.ts
 */

const parts = ['container', 'control', 'label']

export const Radio: ComponentMultiStyleConfig = {
  parts,
  baseStyle: ({ colorScheme: c, theme }) => ({
    // Control is the circular part of the radio button
    control: {
      border: '0.125rem solid',
      borderColor: `${c}.500`,
      // When the label is long and overflows to the next line, we want
      // the radio to be aligned with the first line rather than the center
      alignSelf: 'start',
      _focus: {
        boxShadow: 'none',
      },
      _checked: {
        bg: 'white',
        color: `${c}.500`,
        _hover: {
          bg: 'white',
        },
        // the ::before pseudoclass controls the solid circle which indicates
        // that the radio button is checked
        _before: {
          w: '67%',
          h: '67%',
        },
      },
      _disabled: {
        borderColor: getColor(theme, `neutral.500`),
        bg: 'white',
        _checked: {
          borderColor: getColor(theme, `neutral.500`),
          color: getColor(theme, `neutral.500`),
          bg: 'white',
        },
      },
    },
    // Container for the circle as well as label
    container: {
      w: '100%',
      px: '0.25rem',
      py: '0.5rem',
      _hover: {
        bg: `${c}.100`,
      },
      _focusWithin: {
        // use boxShadow instead of border to ensure that control and label
        // do not move when option is focused
        boxShadow: `inset 0 0 0 0.125rem ${getColor(theme, `${c}.500`)}`,
      },
      _disabled: {
        bg: 'white',
        cursor: 'not-allowed',
      },
    },
    // Text label
    label: {
      _disabled: {
        color: getColor(theme, `neutral.500`),
        // Chakra automatically sets opacity to 0.4, so override that
        opacity: 1,
      },
      textStyle: 'body-1',
      ml: '1rem',
    },
  }),
  sizes: {
    // md is the default and we only have one size, so override it
    md: {
      control: { w: '1.5rem', h: '1.5rem' },
    },
  },
  defaultProps: {
    colorScheme: 'primary',
  },
}
