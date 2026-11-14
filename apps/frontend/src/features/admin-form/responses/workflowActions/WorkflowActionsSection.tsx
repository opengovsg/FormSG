import { ReactNode, useId, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useDisclosure } from '@chakra-ui/react'

import {
  FormAuthType,
  SubmissionMrfMetadata,
  WorkflowStatus,
} from 'formsg-shared/types'

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
import { useWorkflowReminder } from './RemindButton'
import { restoreWorkflowActionFocus } from './restoreWorkflowActionFocus'
import { SendBackModal } from './SendBackModal'
import { StopWorkflowModal } from './StopWorkflowModal'
import {
  useWorkflowActionsGate,
  useWorkflowActionsSendBackGate,
} from './useWorkflowActionsGate'
import {
  WorkflowActionButtons,
  WorkflowActionDescriptor,
} from './WorkflowActionButtons'
import { WorkflowActionFocusContext } from './WorkflowActionFocusContext'

interface WorkflowActionsSectionProps {
  children?: (args: { actions: WorkflowActionDescriptor[] }) => ReactNode
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
  children,
  submissionId,
  mrf,
  history = { submittedSteps: [], workflow: [] },
  submissionSecretKey,
  stepToken,
  isLoading,
}: WorkflowActionsSectionProps): JSX.Element | null => {
  const ownerId = useId()
  const ownerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<{ element: HTMLElement | null; action: string }>({
    element: null,
    action: '',
  })
  const restoreFocus = () => {
    if (ownerRef.current)
      restoreWorkflowActionFocus(
        ownerRef.current,
        triggerRef.current.element,
        triggerRef.current.action,
        ownerId,
      )
  }
  const { t } = useTranslation()
  const { formId = '' } = useParams()
  const isWorkflowActionsOn = useWorkflowActionsGate()
  const isSendBackOn = useWorkflowActionsSendBackGate()
  const isDelightfulDashboard = useIsDelightfulDashboard()
  const { hasEditAccess } = useAdminFormCollaborators(formId)
  const { data: form } = useAdminForm()
  const stopModal = useDisclosure()
  const addAssigneeModal = useDisclosure()
  const sendBackModal = useDisclosure()
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

  const pendingStepAssignees = getStepRecipients({
    submittedSteps: history.submittedSteps,
    events,
    stepNumber: pendingStepNumber,
  })
  const reminder = useWorkflowReminder({
    formId,
    submissionId,
    submissionSecretKey,
    stepToken,
    recipients: pendingStepAssignees,
  })
  const isPending =
    !mrf?.stoppedAt && mrf?.workflowStatus === WorkflowStatus.PENDING
  const isFixing =
    !!mrf && mrf.workflowCurrentStepNumber < history.submittedSteps.length
  const canRemind =
    isPending &&
    isDelightfulDashboard &&
    !isFixing &&
    pendingStepAssignees.length > 0
  const canActOnWorkflow = isPending && isWorkflowActionsOn && hasEditAccess
  const canSendBackToStepOne = form?.authType === FormAuthType.NIL
  const canRewind =
    hasEditAccess &&
    pendingStepNumber >= (canSendBackToStepOne ? 2 : 3) &&
    mrf?.workflowCurrentStepNumber === history.submittedSteps.length
  const canSendBack = isPending && isSendBackOn && canRewind

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
      { onSuccess: sendBackModal.onClose },
    )
  }

  const handleStop = (emails: string[]) =>
    stopMutation.mutate(
      { submissionId, emails },
      { onSettled: stopModal.onClose },
    )

  const descriptors: WorkflowActionDescriptor[] = []
  const addAction = (
    id: WorkflowActionDescriptor['id'],
    label: string,
    disabled: boolean,
    loading: boolean,
    onClick: () => void,
  ) =>
    descriptors.push({
      id,
      ownerId,
      label,
      tooltip: t(`${WORKFLOW_ACTIONS_I18N}.tooltips.${id}`),
      disabled,
      loading,
      onClick: () => {
        triggerRef.current = {
          element:
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null,
          action: id,
        }
        onClick()
      },
    })
  if (canRemind)
    addAction(
      'remind',
      reminder.isSent
        ? t(
            'features.adminForm.responses.responsesPage.storage.unlockedResponses.responsesTable.sendReminderButton.reminderSent',
          )
        : t(`${WORKFLOW_ACTIONS_I18N}.remindButton`),
      reminder.isSent || !submissionSecretKey,
      reminder.isLoading,
      reminder.onOpen,
    )
  if (canActOnWorkflow && !isFixing)
    addAction(
      'addAssignee',
      t(`${WORKFLOW_ACTIONS_I18N}.reassignButton`),
      isLoading || !submissionSecretKey,
      addAssigneesMutation.isLoading,
      addAssigneeModal.onOpen,
    )
  if (canSendBack)
    addAction(
      'sendBack',
      t(`${WORKFLOW_ACTIONS_I18N}.sendBackButton`),
      isLoading || !submissionSecretKey,
      sendBackMutation.isLoading || fixStepMutation.isLoading,
      sendBackModal.onOpen,
    )
  if (canActOnWorkflow)
    addAction(
      'void',
      t(`${WORKFLOW_ACTIONS_I18N}.stopButton`),
      isLoading,
      stopMutation.isLoading,
      stopModal.onOpen,
    )
  const actions = descriptors.length ? (
    <WorkflowActionButtons actions={descriptors} />
  ) : undefined

  return (
    <WorkflowActionFocusContext.Provider value={restoreFocus}>
      <div ref={ownerRef} style={{ display: 'contents' }}>
        {children ? (
          children({ actions: descriptors })
        ) : overview ? (
          <ResponseOverview actions={actions}>{overview}</ResponseOverview>
        ) : (
          actions
        )}
        {canRemind ? reminder.modal : null}
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
          onConfirm={(params, mode) =>
            mode === 'fixStep' ? handleFixStep(params) : handleSendBack(params)
          }
          isLoading={sendBackMutation.isLoading || fixStepMutation.isLoading}
          history={history}
          canSendBackToStepOne={canSendBackToStepOne}
        />
        {canActOnWorkflow && (
          <StopWorkflowModal
            isOpen={stopModal.isOpen}
            onClose={stopModal.onClose}
            onConfirm={handleStop}
            isLoading={stopMutation.isLoading}
          />
        )}
      </div>
    </WorkflowActionFocusContext.Provider>
  )
}
