import { useCallback, useMemo } from 'react'
import {
  ButtonGroup,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { BASICFIELD_TO_DRAWER_META } from '../../constants'
import { useBuilderAndDesignContext } from '../BuilderAndDesignContext'
import { useDeleteFormField } from '../mutations/useDeleteFormField'
import {
  FieldBuilderState,
  stateDataSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'

export const DeleteFieldModal = (): JSX.Element => {
  const stateData = useFieldBuilderStore(stateDataSelector)
  const {
    deleteFieldModalDisclosure: { isOpen, onClose },
  } = useBuilderAndDesignContext()

  const fieldTypeLabel = useMemo(() => {
    if (stateData.state === FieldBuilderState.EditingField) {
      return BASICFIELD_TO_DRAWER_META[stateData.field.fieldType].label
    }
    return null
  }, [stateData])

  const { deleteFieldMutation } = useDeleteFormField()

  const handleDeleteConfirmation = useCallback(() => {
    if (stateData.state === FieldBuilderState.EditingField) {
      deleteFieldMutation.mutate(stateData.field._id, {
        onSuccess: onClose,
      })
    }
  }, [deleteFieldMutation, onClose, stateData])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>Delete {fieldTypeLabel} field</ModalHeader>
        <ModalBody>
          This field will be deleted permanently. Are you sure you want to
          proceed?
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button variant="clear" colorScheme="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="danger"
              onClick={handleDeleteConfirmation}
              isLoading={deleteFieldMutation.isLoading}
            >
              Yes, delete field
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
