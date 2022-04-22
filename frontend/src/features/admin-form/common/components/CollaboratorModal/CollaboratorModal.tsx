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
}

export const CollaboratorModal = ({
  isOpen,
  onClose,
}: CollaboratorModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        {isOpen && (
          <CollaboratorWizardProvider>
            <CollaboratorModalContent />
          </CollaboratorWizardProvider>
        )}
      </ModalContent>
    </Modal>
  )
}
