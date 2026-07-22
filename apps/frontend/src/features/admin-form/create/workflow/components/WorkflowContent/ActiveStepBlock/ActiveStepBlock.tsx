import { useCallback } from 'react'

import { FormWorkflowStep, FormWorkflowStepDto } from 'formsg-shared/types'

import { datadogRum } from '~utils/datadog'

import {
  cancelPendingSwitchSelector,
  completeSaveSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useWorkflowMutations } from '../../../mutations'
import { EditStepBlock } from '../EditStepBlock'

export interface ActiveStepBlockProps {
  stepNumber: number
  step: FormWorkflowStepDto
  handleOpenDeleteModal: () => void
}

const handleTracking = (step: FormWorkflowStep, stepNumber: number) => {
  // stepNumber is 0-indexed
  if (stepNumber === 0) {
    const hasFieldsSelected = step.edit.length > 0
    if (hasFieldsSelected) {
      datadogRum.addAction(
        'workflow_builder.active_step_block.step_one_save_action',
      )
    }
  }

  if (stepNumber === 1) {
    const hasFieldsSelected = step.edit.length > 0
    if (hasFieldsSelected) {
      datadogRum.addAction(
        'workflow_builder.active_step_block.step_two_save_action',
      )
    }
  }
}

export const ActiveStepBlock = ({
  stepNumber,
  step,
  handleOpenDeleteModal,
}: ActiveStepBlockProps): JSX.Element => {
  const { updateStepMutation } = useWorkflowMutations()
  const completeSave = useAdminWorkflowStore(completeSaveSelector)
  const cancelPendingSwitch = useAdminWorkflowStore(cancelPendingSwitchSelector)

  const handleSubmit = useCallback(
    (step: FormWorkflowStep) => {
      handleTracking(step, stepNumber)
      updateStepMutation.mutate(
        {
          stepNumber,
          updateStepBody: step,
        },
        {
          onSuccess: completeSave,
          // Keep the card open and drop any pending switch so a failed
          // auto-save cannot redirect a later successful save.
          onError: cancelPendingSwitch,
        },
      )
    },
    [updateStepMutation, stepNumber, completeSave, cancelPendingSwitch],
  )

  return (
    <EditStepBlock
      stepNumber={stepNumber}
      isLoading={updateStepMutation.isLoading}
      handleOpenDeleteModal={handleOpenDeleteModal}
      onSubmit={handleSubmit}
      defaultValues={step}
      submitButtonLabel="Save step"
    />
  )
}
