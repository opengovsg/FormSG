import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useBreakpointValue,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

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
        <ModalHeader color="secondary.700">Manage collaborators</ModalHeader>
        <ModalBody whiteSpace="pre-line" pb="3.25rem">
          Placeholder content
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
