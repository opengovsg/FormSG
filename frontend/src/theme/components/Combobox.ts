import { menuAnatomy } from '@chakra-ui/anatomy'
import { CSSObject, theme } from '@chakra-ui/react'
import { anatomy, PartsStyleFunction } from '@chakra-ui/theme-tools'
import merge from 'lodash/merge'

import { ComponentMultiStyleConfig } from '~theme/types'

import { Button } from './Button'
import { Input } from './Input'
import { Menu } from './Menu'

const parts = anatomy('combobox').parts(
  'container',
  'list',
  'item',
  'field',
  'clearbutton',
  'icon',
  'emptyItem',
)

export const Combobox: ComponentMultiStyleConfig<typeof parts> = {
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
        my: '0.5rem',
        w: '100%',
        overflowY: 'auto',
        maxH: '12rem',
      } as CSSObject),
      field: theme.components.Input.baseStyle.field,
      item: itemStyle,
      clearbutton: {
        borderLeftRadius: 0,
        ml: '-1px',
      },
      icon: {
        fontSize: '1.25rem',
        color: 'secondary.500',
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
      return {
        list: {
          ...menuOutlineVariant.list,
          py: 0,
        },
        item: merge(menuOutlineVariant.item, {
          cursor: 'pointer',
        } as CSSObject),
        field: {
          ...Input.variants.outline(props).field,
          borderRightRadius: props.isClearable ? 0 : undefined,
        },
        clearbutton: {
          ...Button.variants.outline({ ...props, colorScheme: 'secondary' }),
          borderColor: 'neutral.400',
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
