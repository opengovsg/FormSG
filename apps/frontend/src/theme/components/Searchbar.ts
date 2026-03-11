import { anatomy } from '@chakra-ui/theme-tools'

import { ComponentMultiStyleConfig } from '~theme/types'

import { Input } from './Input'

export const SEARCHBAR_THEME_KEY = 'Searchbar'

const parts = anatomy('searchbar').parts('icon', 'field')

export const Searchbar: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  variants: {
    outline: (props) => {
      const { field } = Input.variants.outline(props)
      const { isExpanded } = props

      return {
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
