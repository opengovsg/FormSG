import { modalAnatomy as parts } from '@chakra-ui/anatomy'
import {
  PartsStyleFunction,
  PartsStyleObject,
  SystemStyleFunction,
  SystemStyleObject,
} from '@chakra-ui/theme-tools'

import { textStyles } from '../textStyles'

const baseStyleOverlay: SystemStyleObject = {
  bg: 'rgba(0, 0, 0, 0.65)',
  zIndex: 'overlay',
}

const baseStyleDialog: SystemStyleFunction = (props) => {
  const { scrollBehavior } = props
  return {
    borderRadius: '0.25rem',
    my: '4rem',
    maxH: scrollBehavior === 'inside' ? 'calc(100% - 16rem)' : undefined,
    boxShadow: 'md',
  }
}

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

export const Modal = {
  parts: parts.keys,
  baseStyle,
  sizes,
}
