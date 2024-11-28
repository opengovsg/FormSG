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
        <ModalHeader>Delete CSV file</ModalHeader>
        <ModalBody>
          Are you sure you want to delete this CSV file? This action cannot be
          undone.
        </ModalBody>
        <ModalFooter>
          <NextAndBackButtonGroup
            nextButtonLabel="Yes, delete CSV file"
            backButtonLabel="No, don't delete"
            handleBack={onClose}
            handleNext={handleDelete}
            nextButtonColorScheme="danger"
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
