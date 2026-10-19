import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BiStopCircle, BiUndo, BiUser } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import { Flex, useDisclosure } from '@chakra-ui/react'

import { SubmissionMrfMetadata, WorkflowStatus } from 'formsg-shared/types'

import Button from '~components/Button'

import { useAdminFormCollaborators } from '~features/admin-form/common/queries'
import { useIsDelightfulDashboard } from '~features/admin-form/responses/hooks'

import { ResponseOverview } from '../IndividualResponsePage/ResponseOverview'

import { AddAssigneeModal } from './AddAssigneeModal'
import { getStepRecipients, WorkflowHistory } from './getStopNotifiedEmails'
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
  overview?: ReactNode
  submissionId: string
  mrf: SubmissionMrfMetadata
  history?: WorkflowHistory
  submissionSecretKey?: string
  stepToken?: string
  isLoading: boolean
}

export const WorkflowActionsSection = ({
  overview,
  submissionId,
  mrf,
  history = { submittedSteps: [], workflow: [] },
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
  const pendingStepNumber = history.submittedSteps.length + 1

  if (mrf?.stoppedAt || mrf?.workflowStatus !== WorkflowStatus.PENDING) {
    return overview ? <ResponseOverview>{overview}</ResponseOverview> : null
  }

  const pendingStepAssignees = getStepRecipients({
    submittedSteps: history.submittedSteps,
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

  if (!canRemind && !canActOnWorkflow && !canSendBack)
    return overview ? <ResponseOverview>{overview}</ResponseOverview> : null

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

  const actions = (
    <Flex gap="0.5rem" wrap="wrap">
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
          size="sm"
          variant="outline"
          colorScheme="secondary"
          leftIcon={<BiUser fontSize="1.25rem" />}
          isDisabled={isLoading || !submissionSecretKey}
          onClick={addAssigneeModal.onOpen}
        >
          {t(`${WORKFLOW_ACTIONS_I18N}.reassignButton`)}
        </Button>
      ) : null}
      {canSendBack ? (
        <Button
          size="sm"
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
        <Button
          size="sm"
          variant="outline"
          colorScheme="danger"
          leftIcon={<BiStopCircle fontSize="1.25rem" />}
          isDisabled={isLoading}
          onClick={stopModal.onOpen}
        >
          {t(`${WORKFLOW_ACTIONS_I18N}.stopButton`)}
        </Button>
      ) : null}
    </Flex>
  )

  return (
    <>
      {overview ? (
        <ResponseOverview actions={actions}>{overview}</ResponseOverview>
      ) : (
        actions
      )}
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
      />
    </>
  )
}
