import { ComponentMultiStyleConfig } from '@chakra-ui/react'

export const PAGINATION_THEME_KEY = 'Pagination'

const baseButtonStyling = (props: Record<string, any>) => {
  const { isSelected } = props
  return {
    p: '0.25rem 0.625rem',
    minH: '2rem',
    minW: '2rem',
    border: 'none',
    borderRadius: '0.25rem',
    bg: isSelected ? 'secondary.500' : 'transparent',
    _active: {
      bg: isSelected ? 'secondary.700' : 'secondary.200',
    },
    _hover: {
      bg: isSelected ? 'secondary.600' : 'secondary.100',
    },
    _focus: {
      boxShadow: `0 0 0 2px var(--chakra-colors-secondary-300)`,
    },
    _disabled: {
      bg: isSelected ? 'secondary.300' : 'transparent',
      cursor: 'not-allowed',
      color: isSelected ? 'white' : 'secondary.300',
      _hover: {
        bg: isSelected ? 'secondary.300' : 'transparent',
        color: isSelected ? 'white' : 'secondary.300',
      },
    },
    color: isSelected ? 'white' : 'secondary.500',
  }
}

export const Pagination: ComponentMultiStyleConfig = {
  parts: ['button', 'container', 'separator', 'stepper', 'text'],
  variants: {
    solid: (props) => {
      const buttonStyling = baseButtonStyling(props)
      const { isDisabled } = props

      return {
        container: {
          display: 'flex',
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
          color: isDisabled ? 'secondary.300' : 'secondary.500',
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
