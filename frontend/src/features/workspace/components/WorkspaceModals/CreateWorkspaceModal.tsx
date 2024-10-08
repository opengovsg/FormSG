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

type CreateWorkspaceInputProps = {
  title: string
}

export interface CreateWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateWorkspaceModal = ({
  isOpen,
  onClose,
}: CreateWorkspaceModalProps): JSX.Element => {
  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useForm<CreateWorkspaceInputProps>({
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

  const { createWorkspaceMutation } = useWorkspaceMutations()

  const handleCreateWorkspace = handleSubmit((data) => {
    createWorkspaceMutation.mutateAsync(data)
    onClose()
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create folder</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text textStyle="subhead-1">Folder name</Text>
          <FormControl isRequired isInvalid={!!errors.title}>
            <Input
              mt="0.75rem"
              autoFocus
              {...register('title', WORKSPACE_TITLE_VALIDATION_RULES)}
            />
            <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
          </FormControl>
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
            <Button onClick={handleCreateWorkspace} isFullWidth={isMobile}>
              Create folder
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
