import { ComponentMultiStyleConfig } from '@chakra-ui/react'

import { Modal } from './Modal'

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

export const Drawer: ComponentMultiStyleConfig = {
  parts,
  baseStyle: (props) => ({
    overlay: Modal.baseStyle(props).overlay,
  }),
}
