import { checkboxAnatomy } from '@chakra-ui/anatomy'
import { getColor, PartsStyleFunction } from '@chakra-ui/theme-tools'

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
const parts = checkboxAnatomy.extend(
  'othersInput',
  'othersContainer',
  'othersCheckbox',
)

const baseStyle: PartsStyleFunction<typeof parts> = ({
  theme,
  colorScheme: c,
}) => ({
  // Control is the box containing the check icon
  control: {
    // Keep bg when printing.
    WebkitPrintColorAdjust: 'exact',
    bg: 'white',
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
    py: '0.625rem',
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
    color: 'secondary.700',
    ml: '1rem',
    overflowWrap: 'anywhere',
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
  othersContainer: {
    px: '0.25rem',
    py: '0.625rem',
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
  othersInput: {
    // To align left of input with left of "Others" label
    ml: '2.625rem',
    mt: '0.625rem',
    // Use 100% of the width, not counting the left margin
    w: 'calc(100% - 2.625rem)',
  },
  othersCheckbox: {
    // To get around an issue where the hover background blocks the border when focused
    _focusWithin: {
      boxShadow: 'none',
    },
    _hover: {
      bg: 'none',
    },
    w: '100%',
  },
})

export const Checkbox = {
  parts: parts.keys,
  baseStyle,
  sizes: {
    // md is the default and we only have one size, so override it
    md: {
      control: { w: '1.5rem', h: '1.5rem' },
      icon: { fontSize: '1rem' },
    },
  },
  defaultProps: {
    colorScheme: 'primary',
  },
}
