import {
  ButtonGroup,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import { LogicDto } from '~shared/types/form'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

interface DeleteLogicModalProps {
  onClose: () => void
  isOpen: boolean
  logic: LogicDto
}

export const DeleteLogicModal = ({
  onClose,
  isOpen,
  logic,
}: DeleteLogicModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">Delete logic</ModalHeader>
        <ModalBody whiteSpace="pre-line">
          <Text textStyle="body-2" color="secondary.500">
            Are you sure you want to delete this logic? This action is not
            reversible.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column', md: 'row' }}
            w="100%"
            justify="flex-end"
          >
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              No, don't delete
            </Button>
            <Button colorScheme="danger">Yes, delete logic</Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
