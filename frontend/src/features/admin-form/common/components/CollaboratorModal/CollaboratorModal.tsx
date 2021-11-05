import {
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useBreakpointValue,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

import { AddCollaboratorInput } from './AddCollaboratorInput'
import { CollaboratorList } from './CollaboratorList'

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

  const handleAddCollaborators = (inputs: AddCollaboratorInputs) => {
    const permission = roleToPermission(inputs.role)
    console.log({ permission, email: inputs.email })
  }

  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">Manage collaborators</ModalHeader>
        <ModalBody whiteSpace="pre-line" pb="3.25rem">
          <AddCollaboratorInput onSubmit={handleAddCollaborators} />
          <Divider mt="2.5rem" mb="2rem" />
          <CollaboratorList />
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
