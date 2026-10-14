import { useTranslation } from 'react-i18next'
import { BiStopCircle, BiTransferAlt } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import { Flex, useDisclosure } from '@chakra-ui/react'

import { SubmissionMrfMetadata, WorkflowStatus } from 'formsg-shared/types'

import Button from '~components/Button'

import { useAdminFormCollaborators } from '~features/admin-form/common/queries'

import { AddAssigneeModal } from './AddAssigneeModal'
import {
  DecryptedResponseLike,
  getStepRecipients,
  WorkflowHistory,
} from './getStopNotifiedEmails'
import { WORKFLOW_ACTIONS_I18N } from './i18n'
import { useAddAssigneesMutation, useStopWorkflowMutation } from './mutations'
import { StopWorkflowModal } from './StopWorkflowModal'
import { useWorkflowActionsGate } from './useWorkflowActionsGate'

interface WorkflowActionsSectionProps {
  submissionId: string
  mrf: SubmissionMrfMetadata
  history?: WorkflowHistory
  responses?: DecryptedResponseLike[]
  submissionSecretKey?: string
  stepToken?: string
  isLoading: boolean
}

export const WorkflowActionsSection = ({
  submissionId,
  mrf,
  history = { submittedSteps: [], workflow: [] },
  responses,
  submissionSecretKey,
  stepToken,
  isLoading,
}: WorkflowActionsSectionProps): JSX.Element | null => {
  const { t } = useTranslation()
  const { formId = '' } = useParams()
  const isWorkflowActionsOn = useWorkflowActionsGate()
  const { hasEditAccess } = useAdminFormCollaborators(formId)
  const stopModal = useDisclosure()
  const addAssigneeModal = useDisclosure()
  const stopMutation = useStopWorkflowMutation(formId)
  const addAssigneesMutation = useAddAssigneesMutation(formId)
  const events = history.workflowEvents
  const pendingStepNumber = history.submittedSteps.length + 1

  if (
    !isWorkflowActionsOn ||
    !hasEditAccess ||
    mrf?.stoppedAt ||
    mrf?.workflowStatus !== WorkflowStatus.PENDING
  ) {
    return null
  }

  const pendingStepAssignees = getStepRecipients({
    submittedSteps: history.submittedSteps,
    events,
    stepNumber: pendingStepNumber,
  })

  const handleAddAssignees = (emails: string[]) => {
    if (!submissionSecretKey) return
    addAssigneesMutation.mutate(
      {
        submissionId,
        emails,
        submissionSecretKey,
        stepToken,
        expectedStepNumber: pendingStepNumber,
      },
      { onSuccess: addAssigneeModal.onClose },
    )
  }

  const handleStop = (emails: string[]) =>
    stopMutation.mutate(
      { submissionId, emails },
      { onSettled: stopModal.onClose },
    )

  return (
    <>
      <Flex gap="0.5rem" wrap="wrap" pt="0.25rem">
        <Button
          variant="outline"
          colorScheme="secondary"
          leftIcon={<BiTransferAlt fontSize="1.25rem" />}
          isDisabled={isLoading || !submissionSecretKey}
          onClick={addAssigneeModal.onOpen}
        >
          {t(`${WORKFLOW_ACTIONS_I18N}.reassignButton`)}
        </Button>
        <Button
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
          {t(`${WORKFLOW_ACTIONS_I18N}.stopButton`)}
        </Button>
      </Flex>
      <AddAssigneeModal
        isOpen={addAssigneeModal.isOpen}
        onClose={addAssigneeModal.onClose}
        onConfirm={handleAddAssignees}
        isLoading={addAssigneesMutation.isLoading}
        currentAssignees={pendingStepAssignees}
      />
      <StopWorkflowModal
        isOpen={stopModal.isOpen}
        onClose={stopModal.onClose}
        onConfirm={handleStop}
        isLoading={stopMutation.isLoading}
        history={history}
        events={events}
        responses={responses}
      />
    </>
  )
}
