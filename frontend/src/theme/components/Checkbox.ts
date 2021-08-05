import { ComponentMultiStyleConfig } from '@chakra-ui/react'
import { getColor } from '@chakra-ui/theme-tools'

/**
 * This must be kept in line with the key from Chakra's internal
 * Checkbox styling to ensure that the styles are merged correctly.
 * https://github.com/chakra-ui/chakra-ui/blob/main/packages/theme/src/components/index.ts
 */
export const CHECKBOX_THEME_KEY = 'Checkbox'

/**
 * With reference to
 * https://github.com/chakra-ui/chakra-ui/blob/main/packages/theme/src/components/checkbox.ts
 */

const parts = ['container', 'control', 'label', 'icon']

export const Checkbox: ComponentMultiStyleConfig = {
  parts,
  baseStyle: ({ colorScheme: c, theme }) => ({
    // Control is the box containing the check icon
    control: {
      borderRadius: '0.25rem',
      border: '0.125rem solid',
      borderColor: `${c}.500`,
      // When the label is long and overflows to the next line, we want
      // the checkbox to be aligned with the first line rather than the center
      alignSelf: 'start',
      _focus: {
        boxShadow: 'none',
      },
      _disabled: {
        borderColor: getColor(theme, `neutral.500`),
        bg: 'white',
        _checked: {
          borderColor: getColor(theme, `neutral.500`),
          bg: getColor(theme, `neutral.500`),
        },
      },
    },
    // Container for the checkbox as well as label
    container: {
      w: '100%',
      px: '0.25rem',
      py: '0.5rem',
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
    // Check mark icon
    icon: {
      // Chakra changes the icon colour if disabled, but we want it to always be white
      color: 'white',
      // Remove default Chakra animations so we can replace with our own. This is because
      // we ran into issues where we could not increase the size of the tick icon without
      // the animation messing up.
      transform: 'scale(1)',
      transition: 'none',
    },
  }),
  sizes: {
    // md is the default and we only have one size, so override it
    md: {
      control: { w: '1.5rem', h: '1.5rem' },
      icon: { fontSize: '1rem' },
    },
  },
}
