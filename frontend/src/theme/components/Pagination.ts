import { ComponentMultiStyleConfig } from '@chakra-ui/react'

export const PAGINATION_THEME_KEY = 'Pagination'

const baseButtonStyling = (props: Record<string, any>) => {
  const { isSelected } = props
  return {
    p: '0.25rem 0.75rem',
    minH: '2rem',
    minW: '2rem',
    border: 'none',
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
      bg: 'transparent',
      cursor: 'not-allowed',
      color: 'secondary.300',
      _hover: {
        bg: 'transparent',
        color: 'secondary.300',
      },
    },
    color: isSelected ? 'white' : 'secondary.500',
  }
}

export const Pagination: ComponentMultiStyleConfig = {
  parts: ['button', 'container', 'separator', 'stepperback', 'steppernext'],
  variants: {
    solid: (props) => {
      const buttonStyling = baseButtonStyling(props)
      return {
        container: {
          textStyle: 'body-2',
        },
        separator: {
          display: 'inline-block',
          p: '0.25rem 0.75rem',
          minH: '2rem',
          minW: '2rem',
        },
        stepperback: {
          ...buttonStyling,
          pr: '0.5rem',
          pl: 0,
          mr: '0.5rem',
        },
        steppernext: {
          ...buttonStyling,
          pl: '0.5rem',
          pr: 0,
          ml: '0.5rem',
        },
        button: buttonStyling,
      }
    },
  },
  defaultProps: {
    variant: 'solid',
  },
}
