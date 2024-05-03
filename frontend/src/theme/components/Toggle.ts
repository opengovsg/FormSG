import { switchAnatomy } from '@chakra-ui/anatomy'
import { getColor } from '@chakra-ui/theme-tools'

import { ComponentMultiStyleConfig } from '~theme/types'
// Call it Switch to be consistent with Chakra UI so the styles
// are merged correctly
export const TOGGLE_THEME_KEY = 'Switch'

const parts = switchAnatomy.extend(
  'textContainer', // container for label and description
  'label',
  'description',
  'overallContainer', // container for our custom component which contains text + toggle
  'icon', // icon in centre of thumb
)

export const Toggle: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  baseStyle: ({ theme }) => ({
    overallContainer: {
      display: 'flex',
      justifyContent: 'space-between',
    },
    label: {
      textStyle: 'subhead-1',
      color: 'brand.secondary.700',
      m: 0,
    },
    description: {
      textStyle: 'body-2',
      color: 'brand.secondary.400',
    },
    container: {
      // To allow container to have a blue border on focus
      positive: 'relative',
      // Spacing between text and track
      ml: '1rem',
    },
    track: {
      bg: 'neutral.400',
      _checked: {
        bg: 'success.500',
      },
      p: 0,
      _focus: {
        boxShadow: `0 0 0 2px white, 0 0 0 3px ${getColor(
          theme,
          'brand.primary.500',
        )}`,
      },
    },
    thumb: {
      // To centre icon
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      m: '0.0625rem',
      _checked: {
        boxShadow: `inset 0 0 0 0.0625rem ${getColor(theme, `success.300`)}`,
      },
      boxShadow: `inset 0 0 0 0.0625rem ${getColor(theme, `base.divider.medium`)}`,
    },
    icon: {
      color: 'neutral.400',
      _checked: {
        color: 'success.500',
      },
    },
  }),
  sizes: {
    md: {
      track: {
        w: '2.5rem',
        h: '1.5rem',
      },
      thumb: {
        w: '1.375rem',
        h: '1.375rem',
        _checked: {
          // Ensure that thumb travels the correct distance
          transform: 'translateX(1rem)',
        },
      },
      icon: {
        fontSize: '1rem',
      },
    },
  },
  defaultProps: {
    size: 'md',
  },
}
