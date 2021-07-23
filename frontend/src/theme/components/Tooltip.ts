import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

export const TOOLTIP_THEME_KEY = 'CustomTooltip'
export const CustomTooltip: ComponentMultiStyleConfig = {
  parts: ['tooltip', 'wrapper'],
  baseStyle: {
    tooltip: {
      '--tooltip-bg': 'var(--chakra-colors-secondary-700)',
      px: '0.75rem',
      py: '0.5rem',
      color: 'white',
      textStyle: 'body-2',
      borderRadius: '0.25rem',
      textAlign: 'left',
      margin: '0.25rem',
      maxWidth: '18.75rem',
    },
    wrapper: {
      display: 'inline-flex',
      flexWrap: 'wrap',
      _focus: {
        outline: 'none',
      },
    },
  },
}
