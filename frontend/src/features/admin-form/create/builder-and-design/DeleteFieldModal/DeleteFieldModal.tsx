import { useCallback, useMemo } from 'react'
import {
  ButtonGroup,
  Icon,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  UnorderedList,
} from '@chakra-ui/react'
import { Button, ModalCloseButton } from '@opengovsg/design-system-react'

import { BASICFIELD_TO_DRAWER_META } from '../../constants'
import { useAdminFormLogic } from '../../logic/hooks/useAdminFormLogic'
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
    deleteFieldModalDisclosure: { onClose },
  } = useBuilderAndDesignContext()
  const { mapIdToField, logicedFieldIdsSet } = useAdminFormLogic()

  const { fieldIsInLogic, fieldIcon, fieldLabel } = useMemo(() => {
    if (stateData.state !== FieldBuilderState.EditingField) return {}
    const questionNumber = mapIdToField?.[stateData.field._id].questionNumber
    const fieldTitle = stateData.field.title
    return {
      fieldIsInLogic: logicedFieldIdsSet?.has(stateData.field._id),
      fieldIcon: BASICFIELD_TO_DRAWER_META[stateData.field.fieldType].icon,
      fieldLabel: questionNumber
        ? `${questionNumber}. ${fieldTitle}`
        : fieldTitle,
    }
  }, [mapIdToField, stateData, logicedFieldIdsSet])

  const { deleteFieldMutation } = useDeleteFormField()

  const handleDeleteConfirmation = useCallback(() => {
    if (stateData.state === FieldBuilderState.EditingField) {
      deleteFieldMutation.mutate(stateData.field._id, {
        onSuccess: onClose,
      })
    }
  }, [deleteFieldMutation, onClose, stateData])

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>Delete field</ModalHeader>
        <ModalBody>
          <Text color="brand.secondary.500">
            {fieldIsInLogic
              ? `This field is used in your form logic, so deleting it may cause
                your logic to stop working correctly. Are you sure you want to 
                delete this field?`
              : `Are you sure you want to delete this field? This action
                cannot be undone.`}
          </Text>
          <UnorderedList
            spacing="0.5rem"
            listStyleType="none"
            ml="1.75rem"
            mt="1rem"
          >
            <ListItem
              display="flex"
              alignItems="flex-start"
              wordBreak="break-word"
            >
              <Icon
                as={fieldIcon}
                fontSize="1.25rem"
                h="1.5rem"
                ml="-1.75rem"
                mr="0.5rem"
              />
              {fieldLabel}
            </ListItem>
          </UnorderedList>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button variant="clear" colorScheme="sub" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="critical"
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
