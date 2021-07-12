import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

export const Toast: ComponentMultiStyleConfig = {
  parts: ['container', 'icon', 'close'],
  baseStyle: {
    container: {
      borderRadius: '3px',
      boxSizing: 'border-box',
      padding: '1.125rem',
      // Padding right is 4 rem (normal padding) + width of the button.
      // This is to prevent the button overlapping the text on resize.
      pr: 10,
      mt: 2,
      width: {
        base: 'auto',
        lg: '42.5rem',
      },
      mx: {
        base: 2,
        lg: 'inherit',
      },
    },
    close: {
      right: 4,
      top: 4,
      position: 'absolute',
      fontSize: '1.5rem',
    },
  },
  variants: {
    danger: {
      container: {
        bg: 'danger.100',
        border: '1px solid var(--chakra-colors-danger-500)',
      },
      icon: {
        color: 'danger.500',
      },
    },
    success: {
      container: {
        bg: 'success.100',
        border: '1px solid var(--chakra-colors-success-500)',
      },
      icon: {
        color: 'success.500',
      },
    },
    warning: {
      container: {
        bg: 'warning.100',
        border: '1px solid var(--chakra-colors-warning-500)',
      },
      icon: {
        color: 'warning.500',
      },
    },
  },
}
