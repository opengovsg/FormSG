import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
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

import { FormStatus } from 'formsg-shared/types'

import { ADMINFORM_ROUTE, ADMINFORM_SETTINGS_SUBROUTE } from '~constants/routes'
import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'

import { useAdminForm } from '~features/admin-form/common/queries'

import {
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useWorkflowMutations } from '../../mutations'

interface DeleteWorkflowModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Confirms deleting a form's entire workflow.
 *
 * Shown from two places that mean the same thing: the workflow card's own
 * delete button, and the delete button on step 1. A workflow without its first
 * step has no entry point, so deleting step 1 is deleting the workflow — and
 * offering two different modals for one outcome would suggest otherwise.
 *
 * Which of the two states it shows depends on whether the form is still open.
 * Deleting the workflow while respondents may be part-way through it is refused
 * by the API, so the modal's job when the form is open is not to warn but to
 * send the admin to the one place they can do something about it.
 */
export const DeleteWorkflowModal = ({
  isOpen,
  onClose,
}: DeleteWorkflowModalProps): JSX.Element => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { formId } = useParams()
  const { data: form } = useAdminForm()
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const { deleteWorkflowMutation } = useWorkflowMutations()

  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  const isFormOpen = form?.status === FormStatus.Public

  const copy = t(
    isFormOpen
      ? 'features.adminForm.sidebar.workflow.conditionalRouting.modals.closeFormFirst'
      : 'features.adminForm.sidebar.workflow.conditionalRouting.modals.deleteWorkflow',
    { returnObjects: true },
  )

  const handleGoToSettings = useCallback(() => {
    navigate(`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_SETTINGS_SUBROUTE}`)
  }, [navigate, formId])

  const handleDelete = useCallback(() => {
    // Set here rather than in onSuccess: this component is unmounted by the
    // time that fires, since the card it belongs to is gone with the workflow.
    setToInactive()
    return deleteWorkflowMutation.mutate(undefined, { onSuccess: onClose })
  }, [setToInactive, deleteWorkflowMutation, onClose])

  const isLoading = deleteWorkflowMutation.isLoading

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      closeOnOverlayClick={!isLoading}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton isDisabled={isLoading} />
        <ModalHeader color="secondary.700">{copy.title}</ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Text textStyle="body-2" color="secondary.500">
            {copy.description}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            w="100%"
            justify="flex-end"
          >
            <Button
              variant="clear"
              colorScheme="secondary"
              isDisabled={isLoading}
              onClick={onClose}
            >
              {copy.cancel}
            </Button>
            {isFormOpen ? (
              <Button onClick={handleGoToSettings}>{copy.confirm}</Button>
            ) : (
              <Button
                colorScheme="danger"
                onClick={handleDelete}
                isLoading={isLoading}
              >
                {copy.confirm}
              </Button>
            )}
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
