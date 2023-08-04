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
        <ModalHeader>Delete workspace</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text textStyle="body-2" color="secondary.500">
            {activeWorkspace.formIds.length > 0
              ? `Remove ${activeWorkspace.formIds.length} form(s) from ${activeWorkspace.title} workspace and delete the workspace`
              : 'Are you sure you want to delete this workspace? This action cannot be undone.'}
          </Text>
        </ModalBody>

        <ModalFooter>
          <Stack
            w="100vw"
            direction={{ base: 'column', md: 'row' }}
            spacing={{ base: '2rem', md: '1rem' }}
            gap={{ base: '1rem', md: 'inherit' }}
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
              Yes, delete workspace
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
