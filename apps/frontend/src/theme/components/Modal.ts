import { modalAnatomy as parts } from '@chakra-ui/anatomy'
import { cssVar, defineStyle } from '@chakra-ui/react'
import {
  PartsStyleFunction,
  PartsStyleObject,
  SystemStyleObject,
} from '@chakra-ui/theme-tools'

import { textStyles } from '../textStyles'

const $bg = cssVar('modal-bg')
const $shadow = cssVar('modal-shadow')

const baseStyleOverlay: SystemStyleObject = {
  bg: 'rgba(0, 0, 0, 0.65)',
  zIndex: 'overlay',
}

const baseStyleDialog = defineStyle((props) => {
  const { isCentered, scrollBehavior } = props

  return {
    borderRadius: '4px',
    color: 'inherit',
    my: isCentered ? 'auto' : '4rem',
    mx: isCentered ? 'auto' : undefined,
    zIndex: 'modal',
    maxH: scrollBehavior === 'inside' ? 'calc(100% - 7.5rem)' : undefined,
    [$bg.variable]: 'white',
    [$shadow.variable]: 'shadows.md',
    bg: $bg.reference,
    boxShadow: $shadow.reference,
  }
})

const baseStyle: PartsStyleFunction<typeof parts> = (props) => ({
  overlay: baseStyleOverlay,
  dialog: baseStyleDialog(props),
})

const getSize = (value: string): PartsStyleObject<typeof parts> => {
  const fullDialogStyle: SystemStyleObject = {
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
          ...textStyles['h2'],
          p: '1.5rem',
        },
        closeButton: {
          top: '1.5rem',
          insetEnd: '1.5rem',
        },
      }

    case 'selector':
      return {
        dialog: { maxW: '24rem' },
        header: {
          ...textStyles['h2'],
          p: '1.5rem',
        },
        closeButton: {
          top: '1.5rem',
          insetEnd: '1.5rem',
        },
        body: {
          py: 0,
          px: '1.5rem',
        },
        footer: {
          m: '1.5rem',
          p: 0,
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

const variants = {
  bottom: {
    dialogContainer: {
      flexFlow: 'wrap-reverse',
    },
    dialog: {
      mb: '0rem',
      borderBottomRadius: '0px',
      maxW: '100%',
    },
  },
}

const sizes = {
  mobile: getSize('mobile'),
  md: getSize('md'),
  full: getSize('full'),
  // 'selector-bottom': getSize('selector-bottom'),
  selector: getSize('selector'),
}

export const Modal = {
  parts: parts.keys,
  baseStyle,
  sizes,
  variants,
}
