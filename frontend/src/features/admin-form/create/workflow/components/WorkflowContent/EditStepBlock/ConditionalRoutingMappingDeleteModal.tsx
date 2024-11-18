import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

import { NextAndBackButtonGroup } from '~components/Button/NextAndBackButtonGroup'

interface ConditionalRoutingMappingDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  handleDelete: () => void
}

export const ConditionalRoutingMappingDeleteModal = ({
  isOpen,
  onClose,
  handleDelete,
}: ConditionalRoutingMappingDeleteModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>Delete options to email(s) mapping</ModalHeader>
        <ModalBody>This action cannot be undone.</ModalBody>
        <ModalFooter>
          <NextAndBackButtonGroup
            nextButtonLabel="Delete mapping"
            backButtonLabel="Cancel"
            handleBack={onClose}
            handleNext={handleDelete}
            nextButtonColorScheme="danger"
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
