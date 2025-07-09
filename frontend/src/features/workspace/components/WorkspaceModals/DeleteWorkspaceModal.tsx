import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import { Workspace } from '~shared/types/workspace'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import { useWorkspaceMutations } from '~features/workspace/mutations'

export interface DeleteWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  activeWorkspace: Workspace
  setCurrentWorkspace: Dispatch<SetStateAction<string>>
}

export const DeleteWorkspaceModal = ({
  isOpen,
  onClose,
  activeWorkspace,
  setCurrentWorkspace,
}: DeleteWorkspaceModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  const isMobile = useIsMobile()
  const { t } = useTranslation()

  const { deleteWorkspaceMutation } = useWorkspaceMutations()

  // TODO: handle delete forms together with workspace
  const handleDeleteWorkspace = async () => {
    await deleteWorkspaceMutation.mutateAsync({
      destWorkspaceId: activeWorkspace._id,
    })
    // reset workspace to default
    setCurrentWorkspace('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {t('features.workspace.modals.workspace.delete.title')}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {activeWorkspace.formIds.length > 0 ? (
            <Text textStyle="body-2" color="secondary.500">
              {t(
                'features.workspace.modals.workspace.delete.confirmation.removeForms',
                {
                  formsInActiveWorkspace: activeWorkspace.formIds.length,
                  activeWorkspaceTitle: activeWorkspace.title,
                },
              )}
            </Text>
          ) : (
            <Text textStyle="body-2" color="secondary.500">
              {t(
                'features.workspace.modals.workspace.delete.confirmation.removeWorkspace',
              )}
            </Text>
          )}
        </ModalBody>

        <ModalFooter mt={{ base: '2rem', md: '0' }}>
          <Stack
            w="100vw"
            direction={{ base: 'column', md: 'row' }}
            spacing={{ base: '1rem', md: '1rem' }}
            flexDir={{ base: 'column-reverse', md: 'inherit' }}
            justifyContent="flex-end"
          >
            <Button
              onClick={onClose}
              variant="clear"
              colorScheme="secondary"
              isFullWidth={isMobile}
            >
              {t('features.common.cancel')}
            </Button>
            <Button
              onClick={handleDeleteWorkspace}
              colorScheme="danger"
              isFullWidth={isMobile}
            >
              {t('features.workspace.modals.workspace.delete.confirmDeletion')}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
