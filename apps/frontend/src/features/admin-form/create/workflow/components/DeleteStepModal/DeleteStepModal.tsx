import { useCallback } from 'react'
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
import { ModalCloseButton } from '~components/Modal'

import {
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'
import { useWorkflowMutations } from '../../mutations'
import { isFirstStepByStepNumber } from '../WorkflowContent/utils/isFirstStepByStepNumber'

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
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)
  const { deleteStepMutation } = useWorkflowMutations()
  const { formWorkflow } = useAdminFormWorkflow()
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  const handleDelete = useCallback(() => {
    // Cannot be put in onSuccess since this component will be unmounted by then.
    // No big deal even if we set to inactive here.
    setToInactive()
    return deleteStepMutation.mutate(stepNumber, {
      onSuccess: onClose,
    })
  }, [setToInactive, deleteStepMutation, stepNumber, onClose])

  // Deleting step 1 stops the whole workflow running, rather than just
  // shortening it, so it gets its own copy. Silently turning a live routing
  // form back into an ordinary one is not something to confirm with "this
  // action cannot be undone".
  const isFirstStep = isFirstStepByStepNumber(stepNumber)
  const hasLaterSteps = (formWorkflow?.length ?? 0) > 1

  const genericCopy = t(
    'features.adminForm.sidebar.workflow.conditionalRouting.modals.deleteStep',
    { returnObjects: true },
  )
  const firstStepCopy = t(
    'features.adminForm.sidebar.workflow.conditionalRouting.modals.deleteFirstStep',
    { returnObjects: true },
  )

  const { title, confirm, cancel } = isFirstStep ? firstStepCopy : genericCopy
  const description = !isFirstStep
    ? genericCopy.description
    : hasLaterSteps
      ? firstStepCopy.descriptionWithLaterSteps
      : firstStepCopy.description
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      closeOnOverlayClick={!deleteStepMutation.isLoading}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton isDisabled={deleteStepMutation.isLoading} />
        <ModalHeader color="secondary.700">{title}</ModalHeader>
        <ModalBody whiteSpace="pre-wrap">
          <Text textStyle="body-2" color="secondary.500">
            {description}
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
            >
              {confirm}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
