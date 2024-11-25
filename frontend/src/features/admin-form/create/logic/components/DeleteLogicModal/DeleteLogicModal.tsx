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

import { LogicDto } from '~shared/types/form'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import {
  setToInactiveSelector,
  useAdminLogicStore,
} from '../../adminLogicStore'
import { useLogicMutations } from '../../mutations'

interface DeleteLogicModalProps {
  onClose: () => void
  isOpen: boolean
  logicId: LogicDto['_id']
}

export const DeleteLogicModal = ({
  onClose,
  isOpen,
  logicId,
}: DeleteLogicModalProps): JSX.Element => {
  const setToInactive = useAdminLogicStore(setToInactiveSelector)
  const { deleteLogicMutation } = useLogicMutations()
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  const handleDelete = useCallback(() => {
    // Cannot be put in onSuccess since this component will be unmounted by then.
    // No big deal even if we set to inactive here.
    setToInactive()
    return deleteLogicMutation.mutate(logicId)
  }, [deleteLogicMutation, logicId, setToInactive])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      closeOnOverlayClick={!deleteLogicMutation.isLoading}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton isDisabled={deleteLogicMutation.isLoading} />
        <ModalHeader color="secondary.700">Delete logic</ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Text textStyle="body-2" color="secondary.500">
            Are you sure you want to delete this logic? This action cannot be
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
              isDisabled={deleteLogicMutation.isLoading}
              colorScheme="secondary"
              onClick={onClose}
            >
              No, don't delete
            </Button>
            <Button
              colorScheme="danger"
              onClick={handleDelete}
              isLoading={deleteLogicMutation.isLoading}
            >
              Yes, delete logic
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
