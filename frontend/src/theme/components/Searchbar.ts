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
          alignItems: 'center',
          justifyContent: 'center',
          color: 'secondary.500',
        },
        field: {
          ...field,
          display: isExpanded ? 'initial' : 'none',
          w: isExpanded ? '100%' : 0,
          borderColor: isExpanded ? field.borderColor : 'transparent',
          paddingInlineStart: isExpanded ? '2.75rem' : 0,
          transitionDuration: isExpanded ? 'normal' : 0,
        },
      }
    },
  },
  defaultProps: Input.defaultProps,
}
