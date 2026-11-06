import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BiStopCircle, BiUndo, BiUser, BiWrench } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import { Flex, Text, useDisclosure } from '@chakra-ui/react'

import {
  FormAuthType,
  SubmissionMrfMetadata,
  WorkflowStatus,
} from 'formsg-shared/types'

import Button from '~components/Button'

import {
  useAdminForm,
  useAdminFormCollaborators,
} from '~features/admin-form/common/queries'
import { useIsDelightfulDashboard } from '~features/admin-form/responses/hooks'

import { ResponseOverview } from '../IndividualResponsePage/ResponseOverview'

import { AddAssigneeModal } from './AddAssigneeModal'
import { getStepRecipients, WorkflowHistory } from './getStopNotifiedEmails'
import { WORKFLOW_ACTIONS_I18N } from './i18n'
import {
  useAddAssigneesMutation,
  useFixStepMutation,
  useSendBackWorkflowMutation,
  useStopWorkflowMutation,
} from './mutations'
import { RemindButton } from './RemindButton'
import { SendBackModal } from './SendBackModal'
import { StopWorkflowModal } from './StopWorkflowModal'
import {
  useWorkflowActionsFixStepGate,
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
  const isFixStepOn = useWorkflowActionsFixStepGate()
  const isDelightfulDashboard = useIsDelightfulDashboard()
  const { hasEditAccess } = useAdminFormCollaborators(formId)
  const { data: form } = useAdminForm()
  const stopModal = useDisclosure()
  const addAssigneeModal = useDisclosure()
  const sendBackModal = useDisclosure()
  const fixStepModal = useDisclosure()
  const stopMutation = useStopWorkflowMutation(formId)
  const addAssigneesMutation = useAddAssigneesMutation(formId)
  const sendBackMutation = useSendBackWorkflowMutation(formId)
  const fixStepMutation = useFixStepMutation(formId)
  const events = history.workflowEvents
  const pendingStepNumber = history.submittedSteps.length + 1
  const pendingStepName =
    history.workflow[pendingStepNumber - 1]?.step_name?.trim()
  const pendingStepLabel = `${t(
    `${WORKFLOW_ACTIONS_I18N}.activityLog.stepNumber`,
    {
      stepNumber: pendingStepNumber,
    },
  )}${
    pendingStepName
      ? t(`${WORKFLOW_ACTIONS_I18N}.activityLog.stepNameLabel`, {
          name: pendingStepName,
        })
      : ''
  }`

  if (mrf?.stoppedAt || mrf?.workflowStatus !== WorkflowStatus.PENDING) {
    return overview ? <ResponseOverview>{overview}</ResponseOverview> : null
  }

  const pendingStepAssignees = getStepRecipients({
    submittedSteps: history.submittedSteps,
    events,
    stepNumber: pendingStepNumber,
  })
  const isFixing = mrf.workflowCurrentStepNumber < history.submittedSteps.length
  const canRemind =
    isDelightfulDashboard && !isFixing && pendingStepAssignees.length > 0
  const canActOnWorkflow = isWorkflowActionsOn && hasEditAccess
  const canSendBackToStepOne = form?.authType === FormAuthType.NIL
  const canRewind =
    hasEditAccess &&
    pendingStepNumber >= (canSendBackToStepOne ? 2 : 3) &&
    mrf.workflowCurrentStepNumber === history.submittedSteps.length
  const canSendBack = isSendBackOn && canRewind
  const canFixStep = isFixStepOn && canRewind

  if (!canRemind && !canActOnWorkflow && !canSendBack && !canFixStep)
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
    stepOneRecipientEmail,
    clearResponses,
  }: {
    targetStepNumber: number
    remarks?: string
    stepOneRecipientEmail?: string
    clearResponses: boolean
  }) => {
    if (!submissionSecretKey) return
    sendBackMutation.mutate(
      {
        submissionId,
        targetStepNumber,
        expectedStepNumber: pendingStepNumber,
        submissionSecretKey,
        remarks,
        stepOneRecipientEmail,
        clearResponses,
      },
      { onSuccess: sendBackModal.onClose },
    )
  }

  const handleFixStep = ({
    targetStepNumber,
    remarks,
    stepOneRecipientEmail,
  }: {
    targetStepNumber: number
    remarks?: string
    stepOneRecipientEmail?: string
  }) => {
    if (!submissionSecretKey) return
    fixStepMutation.mutate(
      {
        submissionId,
        targetStepNumber,
        expectedStepNumber: pendingStepNumber,
        submissionSecretKey,
        remarks,
        stepOneRecipientEmail,
      },
      { onSuccess: fixStepModal.onClose },
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
      {isFixing ? (
        <Text textStyle="body-2" color="secondary.500" w="100%">
          {t(`${WORKFLOW_ACTIONS_I18N}.fixingStep`, {
            stepNumber: mrf.workflowCurrentStepNumber + 1,
            returnStepNumber: pendingStepNumber,
          })}
        </Text>
      ) : null}
      {canActOnWorkflow && !isFixing ? (
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
      {canFixStep ? (
        <Button
          size="sm"
          variant="outline"
          colorScheme="secondary"
          leftIcon={<BiWrench fontSize="1.25rem" />}
          isDisabled={isLoading || !submissionSecretKey}
          onClick={fixStepModal.onOpen}
        >
          {t(`${WORKFLOW_ACTIONS_I18N}.fixStepButton`)}
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
        stepName={pendingStepLabel}
      />
      <SendBackModal
        isOpen={sendBackModal.isOpen}
        onClose={sendBackModal.onClose}
        onConfirm={handleSendBack}
        isLoading={sendBackMutation.isLoading}
        history={history}
        canSendBackToStepOne={canSendBackToStepOne}
      />
      <SendBackModal
        isOpen={fixStepModal.isOpen}
        onClose={fixStepModal.onClose}
        onConfirm={handleFixStep}
        isLoading={fixStepMutation.isLoading}
        history={history}
        canSendBackToStepOne={canSendBackToStepOne}
        modal="fixStepModal"
      />
      {canActOnWorkflow && (
        <StopWorkflowModal
          isOpen={stopModal.isOpen}
          onClose={stopModal.onClose}
          onConfirm={handleStop}
          isLoading={stopMutation.isLoading}
        />
      )}
    </>
  )
}
