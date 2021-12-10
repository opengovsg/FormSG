import { anatomy } from '@chakra-ui/theme-tools'

import { ComponentMultiStyleConfig } from '~theme/types'

export type InlineMessageVariant = 'info' | 'error' | 'warning'

const parts = anatomy('inline-message').parts('messagebox', 'icon')

export const InlineMessage: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  baseStyle: {
    messagebox: {
      padding: '8px',
      display: 'flex',
      p: '1rem',
      justifyContent: 'start',
      color: 'secondary.700',
    },
    icon: {
      fontSize: '1.5rem',
      mr: '0.5rem',
    },
  },
  variants: {
    info: {
      messagebox: {
        bg: 'primary.100',
      },
      icon: {
        color: 'primary.500',
      },
    },
    warning: {
      messagebox: {
        bg: 'warning.100',
      },
      icon: {
        color: 'warning.700',
      },
    },
    error: {
      messagebox: {
        bg: 'danger.100',
      },
      icon: {
        color: 'danger.500',
      },
    },
  },
  defaultProps: {
    variant: 'info',
  },
}
