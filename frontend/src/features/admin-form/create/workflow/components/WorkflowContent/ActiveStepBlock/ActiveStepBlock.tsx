import { useCallback } from 'react'

import { FormWorkflowStep, FormWorkflowStepDto } from '~shared/types'

import { datadogRum } from '~utils/datadog'

import {
  setToInactiveSelector,
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
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)

  const handleSubmit = useCallback(
    (step: FormWorkflowStep) => {
      handleTracking(step, stepNumber)
      updateStepMutation.mutate(
        {
          stepNumber,
          updateStepBody: step,
        },
        {
          onSuccess: () => setToInactive(),
        },
      )
    },
    [updateStepMutation, stepNumber, setToInactive],
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
