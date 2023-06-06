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

import { useIsMobile } from '~hooks/useIsMobile'
import { WORKSPACE_TITLE_VALIDATION_RULES } from '~utils/workspaceValidation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Input from '~components/Input'

import { useWorkspaceMutations } from '~features/workspace/mutations'

type RenameWorkspaceInputProps = {
  title: string
}

export interface RenameWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
}

export const RenameWorkspaceModal = ({
  isOpen,
  onClose,
  workspaceId,
}: RenameWorkspaceModalProps): JSX.Element => {
  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useForm<RenameWorkspaceInputProps>({
    defaultValues: {
      title: '',
    },
  })
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  const isMobile = useIsMobile()

  const { updateWorkspaceTitleMutation } = useWorkspaceMutations()

  const handleRenameWorkspace = handleSubmit((data) => {
    updateWorkspaceTitleMutation.mutateAsync({
      title: data.title,
      destWorkspaceId: workspaceId,
    })
    onClose()
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Rename workspace</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text textStyle="subhead-1">Workspace name</Text>
          <FormControl isRequired isInvalid={!!errors.title}>
            <Input
              mt="0.75rem"
              autoFocus
              {...register('title', WORKSPACE_TITLE_VALIDATION_RULES)}
            />
            <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
          </FormControl>
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
            <Button onClick={handleRenameWorkspace} isFullWidth={isMobile}>
              Rename workspace
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
