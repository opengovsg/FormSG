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

import { WORKSPACE_TITLE_VALIDATION_RULES } from '~utils/workspaceValidation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Input from '~components/Input'

type CreateOrRenameWorkspaceInputProps = {
  title: string
}

export interface CreateOrRenameWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
  isCreatingWorkspace: boolean
}

export const CreateOrRenameWorkspaceModal = ({
  isOpen,
  onClose,
  isCreatingWorkspace,
}: CreateOrRenameWorkspaceModalProps): JSX.Element => {
  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useForm<CreateOrRenameWorkspaceInputProps>({
    defaultValues: {
      title: '',
    },
  })
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  // TODO (hans): Implement create workspace functionality
  const handleCreateWorkspace = handleSubmit((data) => {
    onClose()
  })

  const handleRenameWorkspace = handleSubmit((data) => {
    onClose()
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {isCreatingWorkspace ? 'Create' : 'Rename'} workspace
        </ModalHeader>
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
            <Button onClick={onClose} variant="clear" colorScheme="secondary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (isCreatingWorkspace) {
                  handleCreateWorkspace()
                } else {
                  handleRenameWorkspace()
                }
              }}
            >
              {isCreatingWorkspace ? 'Create' : 'Rename'} workspace
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
