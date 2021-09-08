import {
  ComponentMultiStyleConfig,
  StyleObjectOrFn,
  SystemStyleObjectRecord,
  ThemeComponentFunction,
  ThemingPropsThunk,
} from '@chakra-ui/react'

import { textStyles } from '~theme/textStyles'

// Default parts.
const parts = [
  'overlay',
  'dialogContainer',
  'dialog',
  'header',
  'closeButton',
  'body',
  'footer',
]

const baseStyleOverlay: StyleObjectOrFn = {
  bg: 'rgba(0, 0, 0, 0.65)',
}

const baseStyleDialog: ThemeComponentFunction<StyleObjectOrFn> = (props) => {
  const { scrollBehavior } = props
  return {
    borderRadius: '0.25rem',
    my: '8rem',
    maxH: scrollBehavior === 'inside' ? 'calc(100% - 16rem)' : undefined,
    boxShadow: 'md',
  }
}

const baseStyle: ThemingPropsThunk<SystemStyleObjectRecord> = (props) => ({
  overlay: baseStyleOverlay,
  dialog: baseStyleDialog(props),
})

const getSize = (value: string): SystemStyleObjectRecord => {
  const fullDialogStyle: StyleObjectOrFn = {
    maxW: '100vw',
    minH: '100vh',
    my: 0,
    borderRadius: 0,
    bg: 'neutral.100',
  }

  switch (value) {
    case 'mobile':
      return {
        header: {
          pt: '2rem',
          pb: '1.5rem',
          px: '1.5rem',
          ...textStyles['h3'],
        },
        body: {
          flex: 'initial',
        },
        dialog: fullDialogStyle,
        closeButton: {
          top: '2rem',
          insetEnd: '1.5rem',
        },
      }
    case 'full':
      return {
        overlay: {
          bg: 'none',
        },
        dialog: fullDialogStyle,
        header: {
          p: '1.5rem',
        },
        closeButton: {
          top: '1.5rem',
          insetEnd: '1.5rem',
        },
      }
    default:
      return {
        dialog: { maxW: '42.5rem' },
        header: {
          ...textStyles['h2'],
          pt: '2rem',
          pb: '1rem',
          px: '2rem',
        },
        closeButton: {
          top: '2rem',
          insetEnd: '2rem',
        },
        body: {
          py: 0,
          px: '2rem',
        },
        footer: {
          pt: '2rem',
          pb: '2.75rem',
          px: '2rem',
        },
      }
  }
}

const sizes = {
  mobile: getSize('mobile'),
  md: getSize('md'),
  full: getSize('full'),
}

export const Modal: ComponentMultiStyleConfig = {
  parts,
  baseStyle,
  sizes,
}
