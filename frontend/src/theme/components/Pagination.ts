import { anatomy, SystemStyleFunction } from '@chakra-ui/theme-tools'

import { ComponentMultiStyleConfig } from '~theme/types'

const parts = anatomy('pagination').parts(
  'button',
  'container',
  'separator',
  'stepper',
  'text',
)

export const PAGINATION_THEME_KEY = 'Pagination'

const baseButtonStyling: SystemStyleFunction = (props) => {
  const { isSelected } = props
  return {
    p: '0.25rem 0.625rem',
    minH: '2rem',
    minW: '2rem',
    h: 'auto',
    border: 'none',
    borderRadius: '0.25rem',
    bg: isSelected ? 'brand.secondary.500' : 'transparent',
    _active: {
      bg: isSelected ? 'brand.secondary.700' : 'brand.secondary.200',
    },
    _hover: {
      bg: isSelected ? 'brand.secondary.600' : 'brand.secondary.100',
    },
    _focus: {
      boxShadow: `0 0 0 2px var(--chakra-colors-secondary-300)`,
    },
    _disabled: {
      bg: isSelected ? 'brand.secondary.300' : 'transparent',
      cursor: 'not-allowed',
      color: isSelected ? 'white' : 'brand.secondary.300',
      _hover: {
        bg: isSelected ? 'brand.secondary.300' : 'transparent',
        color: isSelected ? 'white' : 'brand.secondary.300',
      },
    },
    color: isSelected ? 'white' : 'brand.secondary.500',
  }
}

export const Pagination: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  variants: {
    solid: (props) => {
      const buttonStyling = baseButtonStyling(props)
      const { isDisabled } = props

      return {
        container: {
          display: 'flex',
          justifyContent: 'center',
          textStyle: 'body-2',
        },
        separator: {
          display: 'inline-block',
          p: '0.25rem 0.75rem',
          minH: '2rem',
          minW: '2rem',
        },
        text: {
          alignSelf: 'center',
          p: '0.25rem 0.75rem',
          color: isDisabled ? 'brand.secondary.300' : 'brand.secondary.500',
        },
        stepper: {
          ...buttonStyling,
          fontSize: '1.5rem',
          pl: 0,
          pr: 0,
          _first: {
            mr: '0.25rem',
          },
          _last: {
            ml: '0.25rem',
          },
        },
        button: buttonStyling,
      }
    },
  },
  defaultProps: {
    variant: 'solid',
  },
}
