import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BiFileBlank } from 'react-icons/bi'
import {
  Container,
  Icon,
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  UnorderedList,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { AdminDashboardFormMetaDto } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { useDeleteFormMutation } from '~features/workspace/mutations'

export interface DeleteFormModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  formToDelete?: Pick<AdminDashboardFormMetaDto, '_id' | 'title' | 'admin'>
}

export const DeleteFormModal = ({
  isOpen,
  onClose,
  formToDelete,
}: DeleteFormModalProps): JSX.Element | null => {
  const { t } = useTranslation()
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  const isMobile = useIsMobile()

  const { deleteFormMutation } = useDeleteFormMutation()

  const handleDeleteForm = useCallback(() => {
    if (!formToDelete) return
    return deleteFormMutation.mutate(formToDelete._id, {
      onSuccess: onClose,
    })
  }, [deleteFormMutation, formToDelete, onClose])

  if (!formToDelete) return null

  const { title, description, confirm } = t(
    'features.workspace.modals.forms.delete',
    { returnObjects: true },
  )
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">
          <Container maxW="42.5rem" p={0}>
            {title}
          </Container>
        </ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Text color="secondary.500">{description}</Text>
          <UnorderedList
            spacing="0.5rem"
            listStyleType="none"
            ml="1.75rem"
            mt="1rem"
          >
            <ListItem display="flex" alignItems="flex-start">
              <Icon
                as={BiFileBlank}
                fontSize="1.25rem"
                h="1.5rem"
                ml="-1.75rem"
                mr="0.5rem"
              />
              {formToDelete?.title}
            </ListItem>
          </UnorderedList>
        </ModalBody>
        <ModalFooter>
          <Stack
            flex={1}
            spacing="1rem"
            direction={{ base: 'column', md: 'row-reverse' }}
          >
            <Button
              colorScheme="danger"
              isFullWidth={isMobile}
              isDisabled={!formToDelete}
              isLoading={deleteFormMutation.isLoading}
              onClick={handleDeleteForm}
            >
              {confirm}
            </Button>
            <Button
              isFullWidth={isMobile}
              variant="clear"
              colorScheme="secondary"
              onClick={onClose}
              isDisabled={deleteFormMutation.isLoading}
            >
              {t('features.common.cancel')}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
