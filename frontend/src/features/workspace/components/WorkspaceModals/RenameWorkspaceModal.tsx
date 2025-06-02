import { useEffect } from 'react'
import { RegisterOptions, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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

import { Workspace } from '~shared/types/workspace'

import { useIsMobile } from '~hooks/useIsMobile'
import { useWorkspaceTitleValidationRules } from '~utils/workspaceValidation'
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
  activeWorkspace: Workspace
}

export const RenameWorkspaceModal = ({
  isOpen,
  onClose,
  activeWorkspace,
}: RenameWorkspaceModalProps): JSX.Element => {
  const { t } = useTranslation()
  const { updateWorkspaceTitleMutation } = useWorkspaceMutations()
  const {
    handleSubmit,
    formState: { errors },
    register,
    reset,
  } = useForm<RenameWorkspaceInputProps>({
    defaultValues: {
      title: activeWorkspace.title,
    },
  })

  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  const isMobile = useIsMobile()
  const workspaceValidationRules = useWorkspaceTitleValidationRules()

  const handleRenameWorkspace = handleSubmit((data) => {
    // no changes made
    if (data.title === activeWorkspace.title) return onClose()
    updateWorkspaceTitleMutation.mutateAsync({
      title: data.title,
      destWorkspaceId: activeWorkspace._id.toString(),
    })
    onClose()
  })

  useEffect(() => {
    reset({ title: activeWorkspace.title })
  }, [reset, activeWorkspace])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {t('features.workspace.modals.workspace.rename.renameFolder')}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text textStyle="subhead-1">
            {t('features.workspace.modals.workspace.rename.folderName')}
          </Text>
          <FormControl isRequired isInvalid={!!errors.title}>
            <Input
              mt="0.75rem"
              autoFocus
              {...register(
                'title',
                workspaceValidationRules as RegisterOptions<
                  RenameWorkspaceInputProps,
                  'title'
                >,
              )}
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
              {t('features.common.cancel')}
            </Button>
            <Button onClick={handleRenameWorkspace} isFullWidth={isMobile}>
              {t('features.workspace.modals.workspace.rename.renameFolder')}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
