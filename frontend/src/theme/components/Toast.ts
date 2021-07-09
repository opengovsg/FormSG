import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

export const Toast: ComponentMultiStyleConfig = {
  parts: ['alert', 'close'],
  baseStyle: {
    alert: {
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
}
