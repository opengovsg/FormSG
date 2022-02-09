import { menuAnatomy } from '@chakra-ui/anatomy'
import { CSSObject, theme } from '@chakra-ui/react'
import {
  anatomy,
  PartsStyleFunction,
  PartsStyleObject,
} from '@chakra-ui/theme-tools'
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

const sizes: Record<string, PartsStyleObject<typeof parts>> = {
  md: {
    clearbutton: {
      // Remove extra 1px of border.
      p: '11px',
      w: 'auto',
      minW: '2.75rem',
      minH: '2.75rem',
    },
  },
}

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
        // To accomodate focus ring.
        mt: '1px',
        w: '100%',
        overflowY: 'auto',
        maxH: '12rem',
      } as CSSObject),
      field: theme.components.Input.baseStyle.field,
      item: itemStyle,
      clearbutton: {
        transitionProperty: 'common',
        transitionDuration: 'normal',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'secondary.500',
        borderRightRadius: '4px',
        borderLeftRadius: 0,
      },
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
        field: {
          ...inputOutlineVariant,
          zIndex: 1,
          borderRightRadius: props.isClearable ? 0 : undefined,
        },
        clearbutton: {
          ...merge(inputOutlineVariant, { _focus: { zIndex: 1 } }),
          ml: '-1px',
          _hover: {
            _disabled: {
              bg: 'neutral.200',
            },
          },
          _active: {
            _disabled: {
              bg: 'neutral.200',
            },
          },
          borderColor: 'neutral.400',
          _disabled: {
            cursor: 'not-allowed',
            bg: 'neutral.200',
            color: 'neutral.500',
          },
        },
      }
    },
  },
  sizes,
  defaultProps: {
    variant: 'outline',
    size: 'md',
    focusBorderColor: Input.defaultProps.focusBorderColor,
    errorBorderColor: Input.defaultProps.errorBorderColor,
  },
}
