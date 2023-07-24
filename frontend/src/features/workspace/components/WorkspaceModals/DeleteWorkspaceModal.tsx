import { useForm } from 'react-hook-form'
import {
  FormControl,
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
import { isEmpty } from 'lodash'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio from '~components/Radio'

import { useWorkspaceMutations } from '~features/workspace/mutations'
import { useWorkspaceContext } from '~features/workspace/WorkspaceContext'

export interface DeleteWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
}

const DELETE_OPTIONS = [
  'Delete Workspace only',
  'Delete Workspace and all forms within',
]

export const DeleteWorkspaceModal = ({
  isOpen,
  onClose,
}: DeleteWorkspaceModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  const isMobile = useIsMobile()

  const { deleteWorkspaceMutation } = useWorkspaceMutations()
  const { setCurrentWorkspace, activeWorkspace } = useWorkspaceContext()

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
          {activeWorkspace.formIds.length > 0 && (
            <Text textStyle="body-2" color="secondary.500">
              {`Remove ${activeWorkspace.formIds.length} form(s) from ${activeWorkspace.title} workspace and delete the workspace`}
            </Text>
          )}
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
