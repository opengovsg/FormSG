import { useTranslation } from 'react-i18next'
import { BiStopCircle, BiTransferAlt, BiUndo } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import { Flex, useDisclosure } from '@chakra-ui/react'

import { SubmissionMrfMetadata, WorkflowStatus } from 'formsg-shared/types'

import Button from '~components/Button'

import { useAdminFormCollaborators } from '~features/admin-form/common/queries'
import { useIsDelightfulDashboard } from '~features/admin-form/responses/hooks'

import { AddAssigneeModal } from './AddAssigneeModal'
import {
  DecryptedResponseLike,
  getStepRecipients,
  WorkflowHistory,
} from './getStopNotifiedEmails'
import { WORKFLOW_ACTIONS_I18N } from './i18n'
import {
  useAddAssigneesMutation,
  useSendBackWorkflowMutation,
  useStopWorkflowMutation,
} from './mutations'
import { RemindButton } from './RemindButton'
import { SendBackModal } from './SendBackModal'
import { StopWorkflowModal } from './StopWorkflowModal'
import {
  useWorkflowActionsGate,
  useWorkflowActionsSendBackGate,
} from './useWorkflowActionsGate'

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
  const isSendBackOn = useWorkflowActionsSendBackGate()
  const isDelightfulDashboard = useIsDelightfulDashboard()
  const { hasEditAccess } = useAdminFormCollaborators(formId)
  const stopModal = useDisclosure()
  const addAssigneeModal = useDisclosure()
  const sendBackModal = useDisclosure()
  const stopMutation = useStopWorkflowMutation(formId)
  const addAssigneesMutation = useAddAssigneesMutation(formId)
  const sendBackMutation = useSendBackWorkflowMutation(formId)
  const events = history.workflowEvents
  const pendingStepNumber = history.submittedSteps.length + 1

  if (mrf?.stoppedAt || mrf?.workflowStatus !== WorkflowStatus.PENDING) {
    return null
  }

  const pendingStepAssignees = getStepRecipients({
    submittedSteps: history.submittedSteps,
    events,
    stepNumber: pendingStepNumber,
  })
  const canRemind = isDelightfulDashboard && pendingStepAssignees.length > 0
  const canActOnWorkflow = isWorkflowActionsOn && hasEditAccess
  // Step 1 is never a send back target, so there is a step to go back to only
  // from step 3 on. A workflow under way before submittedSteps was recorded
  // records fewer steps than it has done, and the backend refuses those.
  const canSendBack =
    isSendBackOn &&
    hasEditAccess &&
    pendingStepNumber >= 3 &&
    mrf.workflowCurrentStepNumber === history.submittedSteps.length

  if (!canRemind && !canActOnWorkflow && !canSendBack) return null

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

  const handleSendBack = ({
    targetStepNumber,
    remarks,
  }: {
    targetStepNumber: number
    remarks: string
  }) => {
    if (!submissionSecretKey) return
    sendBackMutation.mutate(
      {
        submissionId,
        targetStepNumber,
        expectedStepNumber: pendingStepNumber,
        submissionSecretKey,
        remarks,
      },
      { onSuccess: sendBackModal.onClose },
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
        {canRemind ? (
          <RemindButton
            formId={formId}
            submissionId={submissionId}
            submissionSecretKey={submissionSecretKey}
            stepToken={stepToken}
            recipients={pendingStepAssignees}
          />
        ) : null}
        {canActOnWorkflow ? (
          <Button
            variant="outline"
            colorScheme="secondary"
            leftIcon={<BiTransferAlt fontSize="1.25rem" />}
            isDisabled={isLoading || !submissionSecretKey}
            onClick={addAssigneeModal.onOpen}
          >
            {t(`${WORKFLOW_ACTIONS_I18N}.reassignButton`)}
          </Button>
        ) : null}
        {canSendBack ? (
          <Button
            variant="outline"
            colorScheme="secondary"
            leftIcon={<BiUndo fontSize="1.25rem" />}
            isDisabled={isLoading || !submissionSecretKey}
            onClick={sendBackModal.onOpen}
          >
            {t(`${WORKFLOW_ACTIONS_I18N}.sendBackButton`)}
          </Button>
        ) : null}
        {canActOnWorkflow ? (
          <>
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
          </>
        ) : null}
      </Flex>
      <AddAssigneeModal
        isOpen={addAssigneeModal.isOpen}
        onClose={addAssigneeModal.onClose}
        onConfirm={handleAddAssignees}
        isLoading={addAssigneesMutation.isLoading}
        currentAssignees={pendingStepAssignees}
      />
      <SendBackModal
        isOpen={sendBackModal.isOpen}
        onClose={sendBackModal.onClose}
        onConfirm={handleSendBack}
        isLoading={sendBackMutation.isLoading}
        history={history}
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
