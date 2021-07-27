import { ComponentStyleConfig } from '@chakra-ui/theme'

export const Tooltip: ComponentStyleConfig = {
  baseStyle: {
    '--tooltip-bg': 'var(--chakra-colors-secondary-700)',
    px: '0.75rem',
    py: '0.5rem',
    color: 'white',
    textStyle: 'body-2',
    borderRadius: '0.25rem',
    textAlign: 'left',
    margin: '0.25rem',
    maxWidth: '19.5rem',
  },
}
