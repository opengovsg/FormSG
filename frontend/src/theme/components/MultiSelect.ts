import { menuAnatomy } from '@chakra-ui/anatomy'
import { CSSObject, theme } from '@chakra-ui/react'
import { anatomy, PartsStyleFunction } from '@chakra-ui/theme-tools'
import merge from 'lodash/merge'

import { ComponentMultiStyleConfig } from '~theme/types'

import { parts as comboboxParts } from './Combobox'
import { Input } from './Input'
import { Menu } from './Menu'

const parts = anatomy('multiselect').parts(
  ...comboboxParts.keys,
  'fieldwrapper',
)

export const MultiSelect: ComponentMultiStyleConfig<typeof parts> = {
  parts: parts.keys,
  baseStyle: (props) => {
    const chakraMenuBaseStyle = theme.components.Menu.baseStyle(props)
    const themeMenuBaseStyle = (
      Menu.baseStyle as PartsStyleFunction<typeof menuAnatomy>
    )(props)

    const itemStyle = merge(chakraMenuBaseStyle.item, themeMenuBaseStyle.item, {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      _selected: themeMenuBaseStyle.item?._focus,
      _first: {
        mt: '0.5rem',
      },
      _last: {
        mb: '0.5rem',
      },
    } as CSSObject)

    return {
      container: {
        pos: 'relative',
      },
      list: merge(chakraMenuBaseStyle.list, themeMenuBaseStyle.list, {
        // To accomodate focus ring.
        mt: '1px',
        w: '100%',
        overflowY: 'auto',
        maxH: '12rem',
      } as CSSObject),
      fieldwrapper: theme.components.Input.baseStyle.field,
      item: itemStyle,
      icon: {
        transitionProperty: 'common',
        transitionDuration: 'normal',
        fontSize: '1.25rem',
        color: 'secondary.500',
        _disabled: {
          cursor: 'not-allowed',
          color: 'neutral.500',
        },
      },
      emptyItem: {
        ...itemStyle,
        fontStyle: 'italic',
        cursor: 'not-allowed',
        _hover: {
          bg: 'initial',
        },
        _active: {
          bg: 'initial',
        },
      },
    }
  },
  variants: {
    outline: (props) => {
      const menuOutlineVariant = (
        Menu.variants?.outline as PartsStyleFunction<typeof menuAnatomy>
      )?.(props)

      const inputOutlineVariant = Input.variants.outline(props).field

      return {
        list: {
          ...menuOutlineVariant.list,
          py: 0,
        },
        item: merge(menuOutlineVariant.item, {
          cursor: 'pointer',
        } as CSSObject),
        fieldwrapper: {
          ...inputOutlineVariant,
          _focusWithin: {
            ...inputOutlineVariant._focus,
            _disabled: {
              boxShadow: 'none',
              borderColor: inputOutlineVariant.borderColor,
            },
          },
          borderRadius: '4px',
        },
        field: {
          border: 'none',
          _focus: {
            boxShadow: 'none',
          },
          _invalid: {
            boxShadow: 'none',
          },
        },
      }
    },
  },
  defaultProps: {
    variant: 'outline',
    size: 'md',
    focusBorderColor: Input.defaultProps.focusBorderColor,
    errorBorderColor: Input.defaultProps.errorBorderColor,
  },
}
