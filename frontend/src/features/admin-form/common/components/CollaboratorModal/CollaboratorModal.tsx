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
    </Modal>
  )
}
