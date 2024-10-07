import { RemoveScroll } from 'react-remove-scroll'
import {
  Modal,
  ModalContent,
  ModalOverlay,
  useBreakpointValue,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

import { CollaboratorModalContent } from './CollaboratorModalContent'
import { CollaboratorWizardProvider } from './CollaboratorWizardContext'

interface CollaboratorModalProps {
  isOpen: boolean
  onClose: () => void
  formId?: string
}

export const CollaboratorModal = ({
  isOpen,
  onClose,
  formId,
}: CollaboratorModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={onClose}>
      {/* HACK: Chakra isn't able to cleanly handle nested scroll locks https://github.com/chakra-ui/chakra-ui/issues/7723 
          We'll override chakra's <RemoveScroll /> manually as react-remove-scroll give priority to the latest mounted instance 
      */}
      <RemoveScroll>
        <ModalOverlay />
        <ModalContent
          // Prevent motion box content from escaping modal
          overflowX="hidden"
        >
          <ModalCloseButton />
          {isOpen && (
            <CollaboratorWizardProvider formId={formId ?? ''} onClose={onClose}>
              <CollaboratorModalContent />
            </CollaboratorWizardProvider>
          )}
        </ModalContent>
      </RemoveScroll>
    </Modal>
  )
}
