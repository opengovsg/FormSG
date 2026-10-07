import { useTranslation } from 'react-i18next'
import { BiStopCircle, BiTransferAlt } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import { Flex, useDisclosure } from '@chakra-ui/react'

import { WorkflowStatus } from 'formsg-shared/types'

import { useToast } from '~hooks/useToast'
import Button from '~components/Button'

import { useUser } from '~features/user/queries'

import { AddAssigneeModal } from './AddAssigneeModal'
import {
  DecryptedResponseLike,
  getStepAssignees,
  WorkflowHistory,
} from './getStopNotifiedEmails'
import { WORKFLOW_STOP_I18N } from './i18n'
import {
  addAssigneesPreview,
  recordReminderPreview,
  stopWorkflowPreview,
  useWorkflowAssignees,
  useWorkflowStop,
} from './previewStore'
import { RemindButton } from './RemindButton'
import { StopWorkflowModal } from './StopWorkflowModal'
import { useIsWorkflowStopEnabled } from './useIsWorkflowStopEnabled'
import {
  sendAssigneeStepEmailPreview,
  sendStopPreviewEmail,
} from './WorkflowStopPreviewService'

interface WorkflowActionsSectionProps {
  submissionId: string
  workflowStatus: WorkflowStatus | undefined
  /** Whether the pending step has recipients to remind. */
  hasNextStepRecipientEmails: boolean
  history?: WorkflowHistory
  responses?: DecryptedResponseLike[]
  /** Needed to send reminders and build step links. */
  submissionSecretKey?: string
  stepToken?: string
  isLoading: boolean
}

/** Remind, Reassign and Stop, for a pending workflow. */
export const WorkflowActionsSection = ({
  submissionId,
  workflowStatus,
  hasNextStepRecipientEmails,
  history = { submittedSteps: [], workflow: [] },
  responses,
  submissionSecretKey,
  stepToken,
  isLoading,
}: WorkflowActionsSectionProps): JSX.Element | null => {
  const { t } = useTranslation()
  const toast = useToast({ status: 'success', isClosable: true })
  const errorToast = useToast({ status: 'danger', isClosable: true })
  const { formId } = useParams()
  const { user } = useUser()
  const isEnabled = useIsWorkflowStopEnabled()
  const stop = useWorkflowStop(submissionId)
  const assignees = useWorkflowAssignees(submissionId)
  const stopModal = useDisclosure()
  const addAssigneeModal = useDisclosure()

  if (
    !isEnabled ||
    !formId ||
    stop ||
    workflowStatus !== WorkflowStatus.PENDING
  )
    return null

  const pendingStepNumber = history.submittedSteps.length + 1
  const pendingStepAssignees = getStepAssignees({
    submittedSteps: history.submittedSteps,
    assignees,
    stepNumber: pendingStepNumber,
  })

  // DESIGN PREVIEW: assignees added here are unknown to the backend, so their
  // emails go through a dev-only endpoint.
  const emailAddedAssignees = (
    emails: string[],
    isReminder: boolean,
    errorLabel: string,
  ) => {
    if (emails.length === 0 || !submissionSecretKey) return
    sendAssigneeStepEmailPreview({
      formId,
      submissionId,
      emails,
      submissionSecretKey,
      stepToken,
      isReminder,
      responses,
    }).catch((error) =>
      errorToast({
        description: `[Design preview] ${errorLabel} not sent: ${String(error)}`,
      }),
    )
  }

  const handleReminderSent = () => {
    recordReminderPreview(submissionId, {
      recipients: pendingStepAssignees,
      sentBy: user?.email,
    })
    emailAddedAssignees(
      assignees
        .filter((assignee) => assignee.stepNumber === pendingStepNumber)
        .flatMap((assignee) => assignee.emails),
      true,
      'Assignee reminder',
    )
  }

  const handleAddAssignees = (emails: string[]) => {
    // TODO(workflow-stop): add the assignees to the step on the backend.
    addAssigneesPreview(submissionId, emails, {
      addedBy: user?.email,
      stepNumber: pendingStepNumber,
    })
    emailAddedAssignees(emails, false, 'Assignee email')
    addAssigneeModal.onClose()
    toast({
      description: t(`${WORKFLOW_STOP_I18N}.addAssigneeModal.toastSuccess`, {
        count: emails.length,
      }),
    })
  }

  const handleStop = (notifiedEmails: string[]) => {
    // TODO(workflow-stop): call the stop endpoint. It must be an atomic
    // conditional write (pending only) and surface a clean error if the final
    // respondent submitted first.
    stopWorkflowPreview(submissionId, {
      stoppedAt: new Date().toISOString(),
      stoppedBy: user?.email ?? '[TBC: actor]',
      notifiedEmails,
    })
    stopModal.onClose()
    toast({ description: t(`${WORKFLOW_STOP_I18N}.stopModal.toastSuccess`) })
    if (notifiedEmails.length > 0) {
      sendStopPreviewEmail({
        formId,
        submissionId,
        emails: notifiedEmails,
        responses,
      }).catch((error) =>
        errorToast({
          description: `[Design preview] Stop email not sent: ${String(error)}`,
        }),
      )
    }
  }

  return (
    <>
      {/* Top padding keeps the 4px focus ring clear of the sticky navbar
          above it on the full-page response view. */}
      <Flex gap="0.5rem" wrap="wrap" pt="0.25rem">
        {hasNextStepRecipientEmails ? (
          <RemindButton
            formId={formId}
            submissionId={submissionId}
            submissionSecretKey={submissionSecretKey}
            stepToken={stepToken}
            recipients={pendingStepAssignees}
            onSent={handleReminderSent}
          />
        ) : null}
        <Button
          variant="outline"
          colorScheme="secondary"
          leftIcon={<BiTransferAlt fontSize="1.25rem" />}
          isDisabled={isLoading}
          onClick={addAssigneeModal.onOpen}
        >
          {t(`${WORKFLOW_STOP_I18N}.reassignButton`)}
        </Button>
        <Button
          // Neutral at rest like other outline actions (e.g. dashboard Edit),
          // turns red on hover to signal a destructive action.
          variant="outline"
          colorScheme="secondary"
          _hover={{
            bg: 'danger.100',
            color: 'danger.500',
            borderColor: 'danger.500',
          }}
          _active={{
            bg: 'danger.200',
            color: 'danger.500',
            borderColor: 'danger.500',
          }}
          leftIcon={<BiStopCircle fontSize="1.25rem" />}
          isDisabled={isLoading}
          onClick={stopModal.onOpen}
        >
          {t(`${WORKFLOW_STOP_I18N}.stopButton`)}
        </Button>
      </Flex>
      <AddAssigneeModal
        isOpen={addAssigneeModal.isOpen}
        onClose={addAssigneeModal.onClose}
        onConfirm={handleAddAssignees}
        currentAssignees={pendingStepAssignees}
      />
      <StopWorkflowModal
        isOpen={stopModal.isOpen}
        onClose={stopModal.onClose}
        onConfirm={handleStop}
        history={history}
        assignees={assignees}
        responses={responses}
      />
    </>
  )
}
