import { useCallback } from 'react'

import { FormWorkflowStep, FormWorkflowStepDto } from '~shared/types'

import { datadogRum } from '~utils/datadog'

import {
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
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
  const { updateStepMutation, deleteStepMutation } = useWorkflowMutations()
  const { formWorkflow } = useAdminFormWorkflow()
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)

  const handleCancel = useCallback(() => {
    // If this is the first step with no fields assigned and it's the only step,
    // delete it instead of just closing the edit view
    const isFirstStep = stepNumber === 0
    const hasNoFields = step.edit.length === 0
    const isOnlyStep = formWorkflow?.length === 1

    if (isFirstStep && hasNoFields && isOnlyStep) {
      deleteStepMutation.mutate(stepNumber, {
        onSuccess: () => setToInactive(),
      })
    } else {
      setToInactive()
    }
  }, [
    stepNumber,
    step.edit.length,
    formWorkflow?.length,
    deleteStepMutation,
    setToInactive,
  ])

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
      handleCancel={handleCancel}
      onSubmit={handleSubmit}
      defaultValues={step}
      submitButtonLabel="Save step"
    />
  )
}
