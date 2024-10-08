import {
  anatomy,
  PartsStyleFunction,
  PartsStyleObject,
  SystemStyleFunction,
} from '@chakra-ui/theme-tools'
import merge from 'lodash/merge'

import { Input } from './Input'
import { Menu } from './Menu'

export const comboboxParts = anatomy('combobox').parts(
  'container',
  'list',
  'item',
  'icon',
  'inputStack',
  'emptyItem',
)

export const parts = anatomy('singleselect')
  .parts(...comboboxParts.keys)
  .extend('field', 'clearbutton')

const itemBaseStyle: SystemStyleFunction = (props) => {
  const menuItemStyle = Menu.baseStyle?.(props).item ?? {}
  return merge(menuItemStyle, {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    _selected: menuItemStyle._focus,
  })
}

const listBaseStyle: SystemStyleFunction = (props) => {
  const menuListStyle = Menu.baseStyle?.(props).list ?? {}
  return merge(menuListStyle, {
    w: '100%',
    overflowY: 'auto',
    maxH: '12rem',
    bg: 'white',
    shadow: 'sm',
  })
}

const baseStyle: PartsStyleFunction<typeof parts> = (props) => {
  const itemStyle = itemBaseStyle(props)
  return {
    container: {
      pos: 'relative',
    },
    item: itemStyle,
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
    list: listBaseStyle(props),
    field: {},
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
  }
}

const sizes: Record<string, PartsStyleObject<typeof parts>> = {
  md: {
    clearbutton: {
      // Remove extra 1px of border.
      p: '11px',
      w: 'auto',
      fontSize: '1.25rem',
      minW: '2.75rem',
      minH: '2.75rem',
    },
  },
}

const variantOutline: PartsStyleFunction<typeof parts> = (props) => {
  const { isClearable, colorScheme: c } = props
  const inputVariantOutline = Input.variants.outline(props)

  return {
    list: { py: 0 },
    item: { cursor: 'pointer' },
    field: merge(inputVariantOutline.field, {
      borderRightRadius: isClearable ? 0 : undefined,
      bg: 'white',
      gridArea: '1 / 1 / 2 / 3',
    }),
    clearbutton: {
      ml: '-1px',
      bg: 'white',
      border: '1px solid',
      borderColor: 'neutral.400',
      color: 'neutral.400',
      _focus: {
        zIndex: 1,
        borderColor: `${c}.500`,
        boxShadow: `0 0 0 1px var(--chakra-colors-${c}-500)`,
      },
      _active: {
        color: 'secondary.500',
      },
      _disabled: {
        cursor: 'not-allowed',
        bg: 'neutral.200',
        color: 'neutral.500',
        _active: {
          bg: 'neutral.200',
          color: 'neutral.500',
        },
      },
    },
  }
}

const variantClear: PartsStyleFunction<typeof parts> = (props) => {
  const _variantOutline = variantOutline(props)
  return {
    ..._variantOutline,
    field: merge(_variantOutline.field, {
      justifyContent: 'end',
      bg: 'transparent',
      color: 'black',
      borderColor: 'transparent',
      _placeholder: {
        color: 'black',
      },
      _hover: {
        borderColor: 'primary.500',
      },
    }),
    inputStack: {
      justifyContent: 'end',
    },
  }
}

const variants = {
  outline: variantOutline,
  clear: variantClear,
}

export const SingleSelect = {
  parts: parts.keys,
  baseStyle,
  variants,
  sizes,
  defaultProps: {
    variant: 'outline',
    size: 'md',
    focusBorderColor: Input.defaultProps.focusBorderColor,
    errorBorderColor: Input.defaultProps.errorBorderColor,
    colorScheme: 'primary',
  },
}
