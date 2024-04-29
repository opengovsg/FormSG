import { anatomy } from '@chakra-ui/theme-tools'

import { ComponentMultiStyleConfig } from '~theme/types'

const parts = anatomy('tile').parts('container', 'title', 'icon', 'subtitle')

export const Tile: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  baseStyle: {
    container: {
      transitionProperty: 'common',
      transitionDuration: 'normal',
      color: 'inherit',
      borderRadius: '0.25rem',
      padding: '1.5rem',
      height: 'auto',
      _hover: {
        bg: 'primary.100',
        _disabled: {
          bg: 'initial',
        },
      },
      _focus: {
        borderColor: 'transparent',
        boxShadow: '0 0 0 2px var(--chakra-colors-primary-500)',
      },
      _active: {
        bg: 'primary.200',
        // borderColor: 'transparent',
        boxShadow: '0 0 0 3px var(--chakra-colors-primary-400)',
        _disabled: {
          boxShadow: 'none',
          bg: 'initial',
        },
        _focus: {
          boxShadow: '0 0 0 3px var(--chakra-colors-primary-500)',
        },
      },
      bg: 'white',
      border: '1px solid',
      borderColor: 'neutral.300',
      whiteSpace: 'pre-wrap',
      flexDir: 'column',
      alignItems: 'flex-start',
      maxWidth: 'inherit',
      textAlign: 'left',
      alignSelf: 'stretch',
      justifyContent: 'stretch',
    },
    title: {
      color: 'secondary.700',
      textStyle: 'h4',
      mt: '1rem',
    },
    icon: {
      boxSize: '2.5rem',
      color: 'secondary.500',
    },
    subtitle: {
      color: 'secondary.500',
      textStyle: 'body-2',
    },
  },
  variants: {
    complex: {
      title: {
        mb: 0,
      },
      subtitle: {
        mb: '1rem',
      },
    },
    simple: {
      title: { mb: '1rem' },
    },
  },
  defaultProps: {
    variant: 'simple',
  },
}
