import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

export type BannerVariant = 'info' | 'error' | 'warn'

export const Banner: ComponentMultiStyleConfig = {
  parts: ['banner', 'item', 'icon', 'link', 'close'],
  baseStyle: {
    item: {
      display: 'flex',
      py: ['1rem', '1rem', '0.5rem'],
      px: '1rem',
      justifyContent: 'space-between',
    },
    icon: {
      fontSize: '1.5rem',
      mr: '0.5rem',
    },
    close: {
      padding: 0,
      mr: '-0.75rem',
      fontSize: '1.5rem',
      my: '-0.25rem',
      _focus: {
        boxShadow: '0 0 0 2px var(--chakra-colors-primary-500)',
      },
    },
  },
  variants: {
    info: {
      banner: {
        color: 'white',
        bg: 'primary.500',
      },
      link: {
        color: 'white',
        _hover: {
          color: 'secondary.100',
        },
        _focus: {
          boxShadow: '0 0 0 2px var(--chakra-colors-white)',
        },
      },
      close: {
        _focus: {
          boxShadow: '0 0 0 2px var(--chakra-colors-white)',
        },
      },
    },
    warn: {
      banner: {
        color: 'secondary.700',
        bg: 'warning.500',
      },
      link: {
        color: 'secondary.700',
        _hover: {
          color: 'primary.700',
        },
      },
    },
    error: {
      banner: {
        color: 'white',
        bg: 'danger.500',
      },
      link: {
        color: 'white',
        _hover: {
          color: 'secondary.100',
        },
        _focus: {
          boxShadow: '0 0 0 2px var(--chakra-colors-white)',
        },
      },
      close: {
        _focus: {
          boxShadow: '0 0 0 2px var(--chakra-colors-white)',
        },
      },
    },
  },
  defaultProps: {
    variant: 'info',
  },
}
