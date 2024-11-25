import { useCallback } from 'react'
import {
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

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import {
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useWorkflowMutations } from '../../mutations'

interface DeleteStepModalProps {
  onClose: () => void
  isOpen: boolean
  stepNumber: number
}

export const DeleteStepModal = ({
  onClose,
  isOpen,
  stepNumber,
}: DeleteStepModalProps): JSX.Element => {
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const { deleteStepMutation } = useWorkflowMutations()
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  const handleDelete = useCallback(() => {
    // Cannot be put in onSuccess since this component will be unmounted by then.
    // No big deal even if we set to inactive here.
    setToInactive()
    return deleteStepMutation.mutate(stepNumber, {
      onSuccess: onClose,
    })
  }, [setToInactive, deleteStepMutation, stepNumber, onClose])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      closeOnOverlayClick={!deleteStepMutation.isLoading}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton isDisabled={deleteStepMutation.isLoading} />
        <ModalHeader color="secondary.700">Delete step</ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Text textStyle="body-2" color="secondary.500">
            Are you sure you want to delete this step? This action cannot be
            undone.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            w="100%"
            justify="flex-end"
          >
            <Button
              variant="clear"
              isDisabled={deleteStepMutation.isLoading}
              colorScheme="secondary"
              onClick={onClose}
            >
              No, don't delete
            </Button>
            <Button
              colorScheme="danger"
              onClick={handleDelete}
              isLoading={deleteStepMutation.isLoading}
            >
              Yes, delete step
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
