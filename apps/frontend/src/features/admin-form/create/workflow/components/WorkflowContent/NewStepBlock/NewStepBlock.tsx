import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BiPlus } from 'react-icons/bi'

import { FormWorkflowStep } from 'formsg-shared/types'

import Button from '~components/Button'
import Tooltip from '~components/Tooltip'

import {
  cancelPendingSwitchSelector,
  completeSaveSelector,
  createOrEditDataSelector,
  isCreatingStateSelector,
  requestSwitchToCreatingSelector,
  setCompletedStepSelector,
  setToCreatingSelector,
  stepDraftSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useWorkflowMutations } from '../../../mutations'
import { AdminEditWorkflowState } from '../../../types'
import { EditStepBlock } from '../EditStepBlock'

export const NewStepBlock = () => {
  const { t } = useTranslation()
  const { formWorkflow, isPaymentEnabled } = useAdminFormWorkflow()
  const { createStepMutation } = useWorkflowMutations()
  const {
    isCreatingState,
    stateData,
    setToCreating,
    requestSwitchToCreating,
    completeSave,
    cancelPendingSwitch,
    setCompletedStep,
  } = useAdminWorkflowStore((state) => ({
    isCreatingState: isCreatingStateSelector(state),
    stateData: createOrEditDataSelector(state),
    setToCreating: setToCreatingSelector(state),
    requestSwitchToCreating: requestSwitchToCreatingSelector(state),
    completeSave: completeSaveSelector(state),
    cancelPendingSwitch: cancelPendingSwitchSelector(state),
    setCompletedStep: setCompletedStepSelector(state),
  }))

  const stepDraft = useAdminWorkflowStore(stepDraftSelector)
  const draftInputs =
    stepDraft?.target.state === AdminEditWorkflowState.CreatingStep
      ? stepDraft.inputs
      : undefined

  const newStepNumber = formWorkflow?.length ?? 0

  const handleAddStep = () => {
    if (stateData) {
      requestSwitchToCreating()
      return
    }
    setToCreating()
  }

  const handleSubmit = useCallback(
    (step: FormWorkflowStep) =>
      createStepMutation.mutate(step, {
        onSuccess: () => {
          setCompletedStep(newStepNumber)
          completeSave()
        },
        onError: cancelPendingSwitch,
      }),
    [
      createStepMutation,
      completeSave,
      cancelPendingSwitch,
      setCompletedStep,
      newStepNumber,
    ],
  )

  if (!formWorkflow) return null

  return isCreatingState ? (
    <EditStepBlock
      stepNumber={formWorkflow.length}
      isLoading={createStepMutation.isLoading}
      onSubmit={handleSubmit}
      defaultValues={draftInputs ?? { edit: [] }}
      submitButtonLabel={t(
        'features.adminForm.sidebar.workflow.approvals.addStep',
      )}
    />
  ) : (
    <Tooltip
      label={
        isPaymentEnabled
          ? t('features.adminForm.sidebar.workflow.paymentEnabledNoSteps')
          : undefined
      }
      shouldWrapChildren={isPaymentEnabled}
    >
      <Button
        onClick={handleAddStep}
        variant="outline"
        leftIcon={<BiPlus />}
        isDisabled={isPaymentEnabled}
      >
        {t('features.adminForm.sidebar.workflow.approvals.addStep')}
      </Button>
    </Tooltip>
  )
}
