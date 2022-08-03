import { useCallback } from 'react'
import { BiFileBlank } from 'react-icons/bi'
import {
  ButtonGroup,
  Container,
  Icon,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  OrderedList,
  Text,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'
import simplur from 'simplur'

import { AdminDashboardFormMetaDto } from '~shared/types'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { useDeleteFormMutation } from '~features/workspace/mutations'

import { useWorkspaceRowsContext } from '../WorkspaceFormRow/WorkspaceRowsContext'

export interface DeleteFormModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  formsToDelete: AdminDashboardFormMetaDto[]
}

export const DeleteFormModal = ({
  isOpen,
  onClose,
  formsToDelete,
}: DeleteFormModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  const { deleteFormMutation } = useDeleteFormMutation()
  const { activeFormMeta } = useWorkspaceRowsContext()

  const handleDeleteForm = useCallback(() => {
    if (!activeFormMeta?._id) return
    return deleteFormMutation.mutate(activeFormMeta._id, {
      onSuccess: onClose,
    })
  }, [activeFormMeta?._id, deleteFormMutation, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">
          <Container maxW="42.5rem" p={0}>
            Delete form
          </Container>
        </ModalHeader>
        <ModalBody whiteSpace="pre-line">
          <Text color="secondary.500">
            {simplur`You will lose all responses and feedback for the following ${[
              formsToDelete.length,
            ]} form[|s]
            permanently. Are you sure you want to delete the ${[
              formsToDelete.length,
            ]} form[|s]?`}
          </Text>
          <OrderedList
            spacing="0.5rem"
            listStyleType="none"
            ml="1.75rem"
            mt="1rem"
          >
            {formsToDelete.map((form) => (
              <ListItem display="flex" alignItems="flex-start">
                <Icon
                  as={BiFileBlank}
                  fontSize="1.25rem"
                  h="1.5rem"
                  ml="-1.75rem"
                  mr="0.5rem"
                />
                {form.title}
              </ListItem>
            ))}
          </OrderedList>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button
              variant="clear"
              colorScheme="secondary"
              onClick={onClose}
              isDisabled={deleteFormMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              colorScheme="danger"
              isDisabled={!formsToDelete.length || !activeFormMeta?._id}
              isLoading={deleteFormMutation.isLoading}
              onClick={handleDeleteForm}
            >
              Yes, delete form
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
