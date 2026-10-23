import { drawerAnatomy as parts } from '@chakra-ui/anatomy'
import { cssVar, defineStyle } from '@chakra-ui/react'
import type {
  PartsStyleFunction,
  SystemStyleFunction,
  SystemStyleObject,
} from '@chakra-ui/theme-tools'

import { textStyles } from '~theme/textStyles'

import { Modal } from './Modal'

const $bg = cssVar('drawer-bg')

const nestedModalOverlay = '.chakra-portal > .chakra-modal__overlay'

const baseStyleOverlay: SystemStyleFunction = (props) => {
  const overlay = Modal.baseStyle(props).overlay ?? {}
  return {
    ...overlay,
    [`& ~ ${nestedModalOverlay}`]: { bg: 'transparent' },
  }
}

const baseStyleDialog = defineStyle({
  [$bg.variable]: 'white',
  _after: {
    content: '""',
    position: 'absolute',
    inset: 0,
    bg: 'transparent',
    pointerEvents: 'none',
    transition: 'background-color 0.15s',
  },
  [`.chakra-portal:has(> ${nestedModalOverlay}) &::after`]: {
    bg: 'rgba(0, 0, 0, 0.65)',
  },
})

const baseStyleHeader: SystemStyleObject = {
  ...textStyles['h2'],
  py: '1.25rem',
  px: '2.5rem',
}

const baseStyleBody: SystemStyleObject = {
  px: '2.5rem',
  bg: 'white',
}

const baseStyle: PartsStyleFunction<typeof parts> = (props) => ({
  overlay: baseStyleOverlay(props),
  dialog: baseStyleDialog,
  header: baseStyleHeader,
  body: baseStyleBody,
})

export const Drawer = {
  parts: parts.keys,
  baseStyle,
}
