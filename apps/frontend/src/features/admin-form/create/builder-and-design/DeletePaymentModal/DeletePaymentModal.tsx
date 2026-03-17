import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

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
  const { t } = useTranslation()

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

  const {
    title,
    description: { payment: description },
    confirmButtonText,
  } = t('features.adminForm.modals.deleteField', { returnObjects: true })

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <Text color="secondary.500">{description}</Text>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              {t('features.common.cancel')}
            </Button>
            <Button
              colorScheme="danger"
              onClick={handleDeleteConfirmation}
              isLoading={deletePaymentFieldMutation.isLoading}
            >
              {confirmButtonText}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
