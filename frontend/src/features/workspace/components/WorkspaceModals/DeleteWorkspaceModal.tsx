import { Dispatch, SetStateAction } from 'react'
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
        <ModalHeader>Delete folder</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {activeWorkspace.formIds.length > 0 ? (
            <Text textStyle="body-2" color="secondary.500">
              Remove {activeWorkspace.formIds.length} form(s) from&nbsp;
              {activeWorkspace.title} and delete the folder? This action cannot
              be undone
            </Text>
          ) : (
            <Text textStyle="body-2" color="secondary.500">
              Are you sure you want to delete this folder? This action cannot be
              undone.
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
              Cancel
            </Button>
            <Button
              onClick={handleDeleteWorkspace}
              colorScheme="danger"
              isFullWidth={isMobile}
            >
              Yes, delete folder
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
