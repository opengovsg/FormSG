import { tabsAnatomy as parts } from '@chakra-ui/anatomy'
import { getColor, PartsStyleFunction } from '@chakra-ui/theme-tools'
import merge from 'lodash/merge'

import { ComponentMultiStyleConfig } from '~theme/types'

import { textStyles } from '../textStyles'

const sizesForLineLightDarkVariant: ComponentMultiStyleConfig<
  typeof parts
>['sizes'] = {
  md: {
    tab: {
      p: '0.25rem',
      mx: '0.75rem',
      _selected: {
        _before: {
          width: 'calc(100% - 0.5rem)',
        },
      },
    },
    tablist: {
      // Allow bottom border to show through
      py: '2px',
    },
  },
}

// Special constant to map sizes specifically to line-light and line-dark variants.
const getSizesForLineLightDarkVariant = (size?: string) => {
  if (!size) return {}
  if (size === 'md') return sizesForLineLightDarkVariant[size]
  return {}
}

const variantLineColor: PartsStyleFunction<typeof parts> = () => ({
  tablist: {
    pt: '2px',
    mt: '-2px',
  },
  tab: {
    ...textStyles['subhead-3'],
    position: 'relative',
    borderRadius: '0.25rem',
    _selected: {
      textStyle: 'subhead-3',
      _before: {
        transitionProperty: 'common',
        transitionDuration: 'normal',
        position: 'absolute',
        content: "''",
        height: '2px',
        bottom: '-2px',
        width: '100%',
      },
    },
    textTransform: 'uppercase',
    _focusVisible: {
      _selected: {
        _before: {
          w: 0,
        },
      },
    },
  },
})

const variantLineLight: PartsStyleFunction<typeof parts> = (props) => {
  const { size } = props
  return merge(variantLineColor(props), getSizesForLineLightDarkVariant(size), {
    tab: {
      color: 'secondary.400',
      _hover: {
        color: 'primary.500',
      },
      _selected: {
        _before: {
          bg: 'primary.500',
        },
        color: 'primary.500',
      },
      _focusVisible: {
        boxShadow: `0 0 0 2px ${getColor(props.theme, 'primary.500')}`,
      },
    },
  })
}

const variantLineDark: PartsStyleFunction<typeof parts> = (props) => {
  const { size } = props
  return merge(variantLineColor(props), getSizesForLineLightDarkVariant(size), {
    tablist: {
      bg: 'secondary.500',
    },
    tab: {
      color: 'neutral.400',
      _hover: {
        color: 'white',
      },
      _selected: {
        _before: {
          bg: 'white',
        },
        color: 'white',
      },
      _focusVisible: {
        boxShadow: `0 0 0 2px white`,
      },
    },
  })
}

const sizesForLineVariant = {
  md: {
    tab: {
      padding: '1rem',
    },
  },
}

const getSizesForLineVariant = (size?: string) => {
  if (!size) return {}
  if (size === 'md') return sizesForLineVariant[size]
  return {}
}

const variantLine: PartsStyleFunction<typeof parts> = (props) => {
  const { colorScheme: c, size } = props
  return merge(getSizesForLineVariant(size), {
    tab: {
      transitionProperty:
        'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform, font-weight',
      textStyle: 'body-1',
      color: 'secondary.500',
      _selected: {
        textStyle: 'subhead-1',
        color: `${c}.500`,
      },
      _hover: {
        color: `${c}.500`,
      },
      _focus: {
        boxShadow: `0 0 0 2px var(--chakra-colors-${c}-500)`,
      },
    },
  })
}

export const Tabs: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  baseStyle: {
    tablist: {
      // Allow drag without showing scrollbar
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      /* Scrollbar for Firefox */
      // Firefox only has these two css properties to customise scrollbar
      scrollbarWidth: 0,
      /* Scrollbar for Chrome, Safari, Opera and Microsoft Edge */
      '&::-webkit-scrollbar': {
        width: 0,
        height: 0,
      },
    },
    tab: {
      textStyle: 'body-1',
      _selected: {
        textStyle: 'subhead-1',
      },
    },
    tabpanel: {
      p: 'initial',
    },
  },
  variants: {
    // Chakra UI already has a line variant, these are our custom variants
    line: variantLine,
    'line-light': variantLineLight,
    'line-dark': variantLineDark,
  },
  defaultProps: {
    colorScheme: 'primary',
    variant: 'line-light',
    size: 'md',
  },
}
