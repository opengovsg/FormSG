import {
  ChakraTheme,
  ComponentMultiStyleConfig,
  SystemStyleObjectRecord,
  ThemingPropsThunk,
} from '@chakra-ui/react'
import { getColor } from '@chakra-ui/theme-tools'
import merge from 'lodash/merge'

const parts = [
  'root', // overall container
  'tablist', // wrapper for tabs themselves (the clickable buttons)
  'tab', // single clickable tab
  'tabpanels', // wrapper for all panels, which contain the CONTENT of the tabs
  'tabpanel', // content for a single tab
  'indicator', // used to render an active tab indicator that animates between selected tabs
]

const createScrollBarStyles = ({
  thumbColor,
  trackColor,
  theme,
}: {
  thumbColor: string
  trackColor: string
  theme: ChakraTheme
}) => {
  return {
    /* Scrollbar for Firefox */
    // Firefox only has these two css properties to customise scrollbar
    scrollbarColor: `${getColor(theme, thumbColor)} ${getColor(
      theme,
      trackColor,
    )}`,
    scrollbarWidth: 'thin',
    /* Scrollbar for Chrome, Safari, Opera and Microsoft Edge */
    '&::-webkit-scrollbar': {
      backgroundColor: trackColor,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: thumbColor,
      // Create the effect of a spacing below the scroll bar by giving
      // it a transparent border
      border: '0.25rem solid rgba(0, 0, 0, 0)',
      // No background drawn beneath border, which allows the border to
      // retain the colour of the scrollbar's background, rather than
      // the thumb colour
      backgroundClip: 'padding-box',
      borderRadius: '0.5rem',
    },
  }
}

const createSizes = () => ({
  md: {
    tab: {
      px: '0',
      mx: '1rem',
      _focusVisible: {
        p: '0.25rem',
        // Subtract 0.25rem from mx and give it to padding so that
        // focus ring can have padding
        mx: '0.75rem',
      },
    },
    tablist: {
      // Leftmost and rightmost spacing comes half from tablist margin,
      // half from tab margin
      mx: '1rem',
      py: '1.125rem',
      '&::-webkit-scrollbar': {
        height: '0.75rem',
      },
    },
  },
})

const variantLine: ThemingPropsThunk<SystemStyleObjectRecord, ChakraTheme> =
  () => ({
    tab: {
      borderBottom: '0.125rem solid transparent',
      _focusVisible: {
        _selected: {
          borderColor: 'transparent',
        },
      },
    },
  })

const variantLight: ThemingPropsThunk<SystemStyleObjectRecord, ChakraTheme> = (
  props,
) => {
  return merge(variantLine(props), {
    tablist: createScrollBarStyles({
      thumbColor: 'secondary.200',
      trackColor: 'transparent',
      theme: props.theme,
    }),
    tab: {
      color: 'primary.300',
      _hover: {
        color: 'primary.400',
      },
      _selected: {
        color: 'primary.500',
        borderColor: 'primary.500',
      },
      _focusVisible: {
        boxShadow: `inset 0 0 0 0.125rem ${getColor(
          props.theme,
          'primary.500',
        )}`,
      },
    },
  })
}

const variantDark: ThemingPropsThunk<SystemStyleObjectRecord, ChakraTheme> = (
  props,
) => {
  return merge(variantLine(props), {
    root: {
      bg: 'secondary.500',
    },
    tablist: createScrollBarStyles({
      thumbColor: 'secondary.400',
      trackColor: 'secondary.500',
      theme: props.theme,
    }),
    tab: {
      color: 'secondary.300',
      _active: {
        bg: 'secondary.500',
      },
      _hover: {
        color: 'secondary.200',
      },
      _selected: {
        color: 'white',
        borderColor: 'white',
      },
      _focusVisible: {
        boxShadow: `inset 0 0 0 0.125rem white`,
      },
    },
  })
}

export const Tabs: ComponentMultiStyleConfig = {
  parts,
  baseStyle: {
    tablist: {
      // overflowX and whiteSpace required for use-drag-scroll library
      overflowX: 'scroll',
      whiteSpace: 'nowrap',
    },
    tab: {
      textStyle: 'subhead-3',
      textTransform: 'uppercase',
    },
  },
  sizes: createSizes(),
  variants: {
    // Chakra UI already has a line variant, these are our custom variants
    'line-light': variantLight,
    'line-dark': variantDark,
  },
  defaultProps: {
    colorScheme: 'primary',
    size: 'md',
  },
}
