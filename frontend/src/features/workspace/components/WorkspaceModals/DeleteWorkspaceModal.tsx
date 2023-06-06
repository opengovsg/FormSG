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
  workspaceId: string
}

const DELETE_OPTIONS = [
  'Delete Workspace only',
  'Delete Workspace and all forms within',
]

export const DeleteWorkspaceModal = ({
  isOpen,
  onClose,
  workspaceId,
}: DeleteWorkspaceModalProps): JSX.Element => {
  const {
    handleSubmit,
    formState: { errors },
    register,
  } = useForm()
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  const isMobile = useIsMobile()

  const { deleteWorkspaceMutation } = useWorkspaceMutations()
  const { setCurrentWorkspace } = useWorkspaceContext()

  // TODO: handle delete forms together with workspace
  const handleDeleteWorkspace = handleSubmit(async (data) => {
    await deleteWorkspaceMutation.mutateAsync({ destWorkspaceId: workspaceId })
    // reset workspace to default
    setCurrentWorkspace('')
    onClose()
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Delete workspace</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text textStyle="body-2" color="secondary.500">
            All responses associated to the forms or workspaces will be deleted.
          </Text>
          <FormControl isRequired isInvalid={!isEmpty(errors)}>
            <Radio.RadioGroup mt="1.5rem">
              {DELETE_OPTIONS.map((o, idx) => (
                <Radio
                  key={idx}
                  value={o}
                  isDisabled={idx === 1}
                  {...register('radio', {
                    required: {
                      value: true,
                      message: 'This field is required',
                    },
                  })}
                >
                  {o}
                </Radio>
              ))}
            </Radio.RadioGroup>
            <FormErrorMessage>{errors['radio']?.message}</FormErrorMessage>
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
