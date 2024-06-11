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

const baseStyleOverlay: SystemStyleFunction = (props) => {
  return Modal.baseStyle(props).overlay ?? {}
}

const baseStyleDialog = defineStyle({
  [$bg.variable]: 'white',
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
