import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

export type InlineMessageVariant = 'info' | 'error' | 'warning'

export const InlineMessage: ComponentMultiStyleConfig = {
  parts: ['messagebox', 'item', 'icon'],
  baseStyle: {
    messagebox: {
      padding: '8px',
    },
    item: {
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
