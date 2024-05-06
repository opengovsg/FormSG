import { useCallback } from 'react'
import {
  ButtonGroup,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react'
import { Button, ModalCloseButton } from '@opengovsg/design-system-react'

import { useCreatePageSidebar } from '../../common'
import { useBuilderAndDesignContext } from '../BuilderAndDesignContext'
import {
  PaymentState,
  stateSelector,
  usePaymentStore,
} from '../BuilderAndDesignDrawer/FieldListDrawer/field-panels/usePaymentStore'
import { FieldListTabIndex } from '../constants'
import { useDeleteFormField } from '../mutations/useDeleteFormField'

export const DeletePaymentModal = (): JSX.Element => {
  const stateData = usePaymentStore(stateSelector)
  const {
    deletePaymentModalDisclosure: { onClose },
  } = useBuilderAndDesignContext()

  const { deletePaymentFieldMutation } = useDeleteFormField()

  const { setFieldListTabIndex } = useCreatePageSidebar()

  const handleDeleteConfirmation = useCallback(() => {
    if (stateData === PaymentState.EditingPayment) {
      deletePaymentFieldMutation.mutate(undefined, {
        onSuccess: () => {
          setFieldListTabIndex(FieldListTabIndex.Basic)
          onClose()
        },
      })
    }
  }, [deletePaymentFieldMutation, onClose, stateData, setFieldListTabIndex])

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>Delete field</ModalHeader>
        <ModalBody>
          <Text color="brand.secondary.500">
            Are you sure you want to delete payment field? This action can't be
            undone.
          </Text>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button variant="clear" colorScheme="sub" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="critical"
              onClick={handleDeleteConfirmation}
              isLoading={deletePaymentFieldMutation.isLoading}
            >
              Yes, delete field
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
