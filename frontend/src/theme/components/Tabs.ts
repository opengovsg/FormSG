/* eslint-disable @typescript-eslint/no-unused-vars */
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

const sizesForLineLightDarkVariant = {
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
      pt: '1.125rem',
      pb: '0.25rem',
      '&::-webkit-scrollbar': {
        height: '0.75rem',
      },
      '&::-webkit-scrollbar-track': {
        // Align the ends of the scrollbar with the content.
        // 0.75 = 1rem (padding) - 0.25rem (transparent border)
        mx: '0.75rem',
      },
    },
  },
}

// Special constant to map sizes specifically to line-light and line-dark variants.
const getSizesForLineLightDarkVariant = (size?: string) => {
  if (!size) return {}
  if (size === 'md') return sizesForLineLightDarkVariant[size]
  return {}
}

const variantLineColor: ThemingPropsThunk<
  SystemStyleObjectRecord,
  ChakraTheme
> = () => ({
  tablist: {
    // overflowX and whiteSpace required for use-drag-scroll library
    overflowX: 'scroll',
    whiteSpace: 'nowrap',
  },
  tab: {
    textStyle: 'subhead-3',
    _selected: {
      textStyle: 'subhead-3',
      fontSize: '1rem',
    },
    textTransform: 'uppercase',
    borderBottom: '0.125rem solid transparent',
    _focusVisible: {
      _selected: {
        borderColor: 'transparent',
      },
    },
  },
})

const variantLineLight: ThemingPropsThunk<
  SystemStyleObjectRecord,
  ChakraTheme
> = (props) => {
  const { size } = props
  return merge(variantLineColor(props), getSizesForLineLightDarkVariant(size), {
    tablist: createScrollBarStyles({
      thumbColor: 'secondary.200',
      trackColor: 'transparent',
      theme: props.theme,
    }),
    tab: {
      color: 'primary.400',
      _hover: {
        color: 'primary.500',
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

const variantLineDark: ThemingPropsThunk<SystemStyleObjectRecord, ChakraTheme> =
  (props) => {
    const { size } = props
    return merge(
      variantLineColor(props),
      getSizesForLineLightDarkVariant(size),
      {
        root: {
          bg: 'secondary.500',
        },
        tablist: createScrollBarStyles({
          thumbColor: 'secondary.400',
          trackColor: 'secondary.500',
          theme: props.theme,
        }),
        tab: {
          color: 'secondary.200',
          _hover: {
            color: 'white',
          },
          _selected: {
            color: 'white',
            borderColor: 'white',
          },
          _focusVisible: {
            boxShadow: `inset 0 0 0 0.125rem white`,
          },
        },
      },
    )
  }

export const Tabs: ComponentMultiStyleConfig = {
  parts,
  baseStyle: {
    tab: {
      textStyle: 'body-1',
      _selected: {
        textStyle: 'subhead-1',
      },
    },
  },
  variants: {
    // Chakra UI already has a line variant, these are our custom variants
    'line-light': variantLineLight,
    'line-dark': variantLineDark,
  },
  defaultProps: {
    colorScheme: 'primary',
    size: 'md',
  },
}
