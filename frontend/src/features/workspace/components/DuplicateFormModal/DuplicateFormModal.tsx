import { RemoveScroll } from 'react-remove-scroll'
import {
  Modal,
  ModalContent,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

import { CreateFormModalContent } from '../CreateFormModal/CreateFormModalContent'

import { DupeFormWizardProvider } from './DupeFormWizardProvider'

export type DuplicateFormModalProps = Pick<
  UseDisclosureReturn,
  'onClose' | 'isOpen'
>

export const DuplicateFormModal = ({
  isOpen,
  onClose,
}: DuplicateFormModalProps) => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      {/* HACK: Chakra isn't able to cleanly handle nested scroll locks https://github.com/chakra-ui/chakra-ui/issues/7723 
          We'll override chakra's <RemoveScroll /> manually as react-remove-scroll give priority to the latest mounted instance 
      */}
      <RemoveScroll>
        <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
          <ModalCloseButton />
          <DupeFormWizardProvider>
            <CreateFormModalContent />
          </DupeFormWizardProvider>
        </ModalContent>
      </RemoveScroll>
    </Modal>
  )
}
