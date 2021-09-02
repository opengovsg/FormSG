import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

export const Toast: ComponentMultiStyleConfig = {
  parts: ['icon', 'close', 'content'],
  baseStyle: {
    icon: {
      position: 'absolute',
      left: '1.125rem',
      top: '1.125rem',
      boxSize: '1.25rem',
    },
    content: {
      // NOTE: This is because the outer container already has padding.
      // So the padding here is icon width + outer padding
      ml: '1.875rem',
    },
    wrapper: {
      borderRadius: '4px',
      boxSizing: 'border-box',
      mt: 2,
      mx: {
        base: 2,
        lg: 'inherit',
      },
      width: {
        base: 'auto',
        lg: '42.5rem',
      },
    },
    container: {
      borderRadius: '4px',
      background: 'inherit',
      padding: '1rem',
      // Padding right is 1rem + 1rem (normal padding) + width of the button.
      // This is to prevent the button overlapping the text on resize.
      pr: '3.5rem',
    },
    close: {
      w: '1.5rem',
      h: '1.5rem',
      insetEnd: '1rem',
      top: '1rem',
      position: 'absolute',
      fontSize: '1.5rem',
    },
  },
  variants: {
    danger: {
      wrapper: {
        bg: 'danger.100',
        border: '1px solid var(--chakra-colors-danger-500)',
      },
      icon: {
        fill: 'danger.500',
      },
    },
    success: {
      wrapper: {
        bg: 'success.100',
        border: '1px solid var(--chakra-colors-success-500)',
      },
      icon: {
        fill: 'success.500',
      },
    },
    warning: {
      wrapper: {
        bg: 'warning.100',
        border: '1px solid var(--chakra-colors-warning-500)',
      },
      icon: {
        fill: 'warning.500',
      },
    },
  },
}
