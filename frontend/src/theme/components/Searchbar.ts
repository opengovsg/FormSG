import { ComponentMultiStyleConfig } from '@chakra-ui/theme'

import { Input } from './Input'

export const SEARCHBAR_THEME_KEY = 'Searchbar'

export const Searchbar: ComponentMultiStyleConfig = {
  parts: ['icon', 'field'],
  baseStyle: {},
  variants: {
    outline: (props: Record<string, any>) => {
      const { field } = Input.variants.outline(props)
      const { isExpanded } = props

      return {
        icon: {
          display: 'flex',
          fontSize: '1rem',
          minHeight: '2.625rem',
          minWidth: '2.625rem',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'secondary.500',
        },
        field: {
          ...field,
          transition: 'padding width 300ms',
          borderColor: isExpanded ? field.borderColor : 'transparent',
          w: isExpanded ? '100%' : '0',
          transitionProperty:
            'var(--chakra-transition-property-common),width,padding',
          paddingInlineStart: isExpanded ? '2.75rem' : 0,
        },
      }
    },
  },
  defaultProps: Input.defaultProps,
}
