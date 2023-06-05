import { drawerAnatomy as parts } from '@chakra-ui/anatomy'
import type {
  PartsStyleFunction,
  SystemStyleFunction,
  SystemStyleObject,
} from '@chakra-ui/theme-tools'

import { textStyles } from '~theme/textStyles'

import { Modal } from './Modal'

const baseStyleOverlay: SystemStyleFunction = (props) => {
  return Modal.baseStyle(props).overlay ?? {}
}

const baseStyleHeader: SystemStyleObject = {
  ...textStyles['h2'],
  py: '1.25rem',
  px: '2.5rem',
}

const baseStyleBody: SystemStyleObject = {
  px: '2.5rem',
}

const baseStyle: PartsStyleFunction<typeof parts> = (props) => ({
  overlay: baseStyleOverlay(props),
  header: baseStyleHeader,
  body: baseStyleBody,
})

export const Drawer = {
  parts: parts.keys,
  baseStyle,
}
