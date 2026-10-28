import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'
import { ModalCloseButton } from '~components/Modal'

import { useAdminForm } from '~features/admin-form/common/queries'

import {
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useWorkflowMutations } from '../../mutations'
import { getDeleteLoginError } from '../../utils/deleteLoginError'

interface DeleteStepModalProps {
  onClose: () => void
  isOpen: boolean
  stepNumber: number
}

export const DeleteStepModal = ({
  onClose,
  isOpen,
  stepNumber,
}: DeleteStepModalProps): JSX.Element => {
  const { t } = useTranslation()
  const { data: form } = useAdminForm()
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const { deleteStepMutation } = useWorkflowMutations()
  // The API refuses the same delete; say why before the admin tries.
  const loginError = getDeleteLoginError(form, stepNumber)
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  // Chakra's focus lock takes the first tabbable element when it is not told
  // otherwise, and that is the close button, since it is ModalContent's first
  // child regardless of sitting in the top right corner.
  //
  // Focus goes to the dialog rather than to any of the buttons. Our Button and
  // CloseButton themes paint `_focus` rather than `_focusVisible`, so a
  // programmatically focused button shows its ring even though the admin
  // opened the modal by clicking, and a ring sitting on an action on open reads
  // as though something has already been chosen. The dialog carries no focus
  // style, so nothing lights up, focus is still inside the lock, and screen
  // readers announce the title and the consequences from role and
  // aria-describedby.
  const dialogRef = useRef<HTMLDivElement>(null)

  const handleDelete = useCallback(() => {
    // Cannot be put in onSuccess since this component will be unmounted by then.
    // No big deal even if we set to inactive here.
    setToInactive()
    return deleteStepMutation.mutate(stepNumber, {
      onSuccess: onClose,
    })
  }, [setToInactive, deleteStepMutation, stepNumber, onClose])

  const { title, description, confirm, cancel } = t(
    'features.adminForm.sidebar.workflow.conditionalRouting.modals.deleteStep',
    { returnObjects: true },
  )
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      closeOnOverlayClick={!deleteStepMutation.isLoading}
      initialFocusRef={dialogRef}
    >
      <ModalOverlay />
      <ModalContent ref={dialogRef}>
        <ModalCloseButton isDisabled={deleteStepMutation.isLoading} />
        <ModalHeader color="secondary.700">{title}</ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Stack spacing="1rem">
            <Text textStyle="body-2" color="secondary.500">
              {description}
            </Text>
            {loginError ? (
              <InlineMessage variant="error">{loginError}</InlineMessage>
            ) : null}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            w="100%"
            justify="flex-end"
          >
            <Button
              variant="clear"
              isDisabled={deleteStepMutation.isLoading}
              colorScheme="secondary"
              onClick={onClose}
            >
              {cancel}
            </Button>
            <Button
              colorScheme="danger"
              onClick={handleDelete}
              isLoading={deleteStepMutation.isLoading}
              isDisabled={!!loginError}
            >
              {confirm}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
