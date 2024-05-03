import { anatomy, MultiStyleConfig } from '@chakra-ui/theme-tools'

export type BannerVariant = 'info' | 'error' | 'warn'

const parts = anatomy('banner').parts('banner', 'item', 'icon', 'link', 'close')

export const Banner: MultiStyleConfig<typeof parts> & {
  parts: typeof parts.keys
} = {
  parts: parts.keys,
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
      ml: '0.5rem',
      mr: '-0.5rem',
      fontSize: '1.5rem',
      w: '1.5rem',
      h: '1.5rem',
    },
  },
  variants: {
    info: {
      banner: {
        color: 'white',
        bg: 'brand.primary.500',
      },
      link: {
        color: 'white',
        _hover: {
          color: 'white',
        },
        _focus: {
          boxShadow: '0 0 0 2px var(--chakra-colors-white)',
        },
      },
    },
    warn: {
      banner: {
        color: 'brand.secondary.700',
        bg: 'warning.500',
      },
      link: {
        color: 'brand.secondary.700',
        _hover: {
          color: 'brand.secondary.700',
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
          color: 'white',
        },
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
