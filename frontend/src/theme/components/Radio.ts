import { radioAnatomy } from '@chakra-ui/anatomy'
import { getColor } from '@chakra-ui/theme-tools'

import { ComponentMultiStyleConfig } from '~theme/types'

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
const parts = radioAnatomy.extend(
  'othersInput',
  'othersContainer',
  'othersRadio',
)

export const Radio: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  baseStyle: ({ colorScheme: c, theme }) => ({
    control: {
      bg: 'white',
      cursor: 'pointer',
      border: '2px solid',
      borderColor: `${c}.500`,
      // When the label is long and overflows to the next line, we want
      // the radio to be aligned with the first line rather than the center
      alignSelf: 'start',
      _before: {
        content: `""`,
        transition: 'transform ease 200ms',
      },
      _focus: {
        boxShadow: 'none',
      },
      _checked: {
        bg: 'white',
        color: `${c}.500`,
        _hover: {
          bg: 'white',
          borderColor: `${c}.500`,
        },
      },
      _invalid: {
        // override Chakra UI style which turns the control red when invalid
        borderColor: `${c}.500`,
      },
      _disabled: {
        borderColor: 'neutral.500',
        bg: 'white',
        _checked: {
          borderColor: 'neutral.500',
          color: 'neutral.500',
          bg: 'white',
        },
      },
    },
    container: {
      w: '100%',
      color: 'secondary.700',
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
        color: 'neutral.500',
        cursor: 'not-allowed',
      },
    },
    // Text label
    label: {
      _disabled: {
        color: 'neutral.500',
        // Chakra automatically sets opacity to 0.4, so override that
        opacity: 1,
      },
      textStyle: 'body-1',
      ml: '1rem',
      overflowWrap: 'anywhere',
    },
    othersContainer: {
      _hover: {
        bg: `${c}.100`,
        _disabled: {
          bg: 'none',
        },
      },
      _focusWithin: {
        // use boxShadow instead of border to ensure that control and label
        // do not move when checkbox is focused
        boxShadow: `inset 0 0 0 0.125rem ${getColor(theme, `${c}.500`)}`,
      },
    },
    othersRadio: {
      // To get around an issue where the hover background blocks the border when focused
      _focusWithin: {
        boxShadow: 'none',
      },
      _hover: {
        bg: 'none',
      },
      p: 0,
    },
  }),
  sizes: {
    // md is the default and we only have one size, so override it
    md: {
      container: {
        px: '0.25rem',
        py: '0.625rem',
      },
      othersContainer: {
        px: '0.25rem',
        py: '0.625rem',
      },
      othersInput: {
        // To align left of input with left of "Others" label
        ml: '2.625rem',
        mt: '0.625rem',
        // Use 100% of the width, not counting the left margin
        w: 'calc(100% - 2.625rem)',
      },
      control: {
        w: '1.5rem',
        h: '1.5rem',
        // the ::before pseudoclass controls the solid circle which indicates
        // that the radio button is checked
        _before: {
          w: '1rem',
          h: '1rem',
          transform: 'scale(0)',
        },
        _checked: {
          _before: {
            w: '1rem',
            h: '1rem',
            transform: 'scale(1)',
          },
        },
      },
    },
  },
  defaultProps: {
    colorScheme: 'primary',
  },
}
