import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ListItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  UnorderedList,
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
  /**
   * Which delete button opened this. Named rather than a boolean so the reason
   * the copy differs is readable here, without opening the call site.
   */
  entryPoint: 'workflow-card' | 'first-step'
}

/**
 * Confirms deleting a form's entire workflow.
 *
 * Shown from two places that mean the same thing: the workflow card's own
 * delete button, and the delete button on step 1. A workflow without its first
 * step has no entry point, so deleting step 1 is deleting the workflow, and
 * offering two different modals for one outcome would suggest otherwise.
 *
 * One modal, but it speaks two ways. Entering from step 1 says so in the title,
 * since the surprise to head off is that a step delete removed everything;
 * entering from the card needs no such explanation, because the button already
 * said workflow. The consequences below the title are identical either way.
 *
 * Both of those assume the form is closed. Deleting the workflow while
 * respondents may be part-way through it is refused by the API, so when the
 * form is open the modal's job is not to warn but to send the admin to the one
 * place they can do something about it. That state reads the same from either
 * entry point: it is about the form's status, not about what was clicked.
 */
export const DeleteWorkflowModal = ({
  isOpen,
  onClose,
  entryPoint,
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

  // Full literal keys rather than an interpolated path: i18next types its keys
  // off string literals, and building the path up would drop that checking.
  const copyKey = isFormOpen
    ? 'features.adminForm.sidebar.workflow.conditionalRouting.modals.closeFormFirst'
    : entryPoint === 'first-step'
      ? 'features.adminForm.sidebar.workflow.conditionalRouting.modals.deleteFirstStep'
      : 'features.adminForm.sidebar.workflow.conditionalRouting.modals.deleteWorkflow'

  const copy = t(copyKey, { returnObjects: true })

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
          {/* The two delete states list their consequences; closeFormFirst has
              a single sentence, and one sentence set as a lone bullet reads as
              a list that lost its other items. Discriminating on the shape of
              the copy keeps that decision with the copy itself. */}
          {Array.isArray(copy.description) ? (
            <UnorderedList styleType="disc" spacing={2}>
              {copy.description.map((consequence) => (
                <ListItem key={consequence}>
                  <Text textStyle="body-2" color="secondary.500">
                    {consequence}
                  </Text>
                </ListItem>
              ))}
            </UnorderedList>
          ) : (
            <Text textStyle="body-2" color="secondary.500">
              {copy.description}
            </Text>
          )}
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
