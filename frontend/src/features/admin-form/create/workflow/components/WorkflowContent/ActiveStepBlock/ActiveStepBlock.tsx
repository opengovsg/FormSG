import { useCallback } from 'react'

import {
  FormWorkflowStep,
  FormWorkflowStepDto,
  WorkflowType,
} from '~shared/types'

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

export const ActiveStepBlock = ({
  stepNumber,
  step,
  handleOpenDeleteModal,
}: ActiveStepBlockProps): JSX.Element => {
  const { updateStepMutation } = useWorkflowMutations()
  const setToInactive = useAdminWorkflowStore(setToInactiveSelector)

  const defaultValues =
    // A bit of instrumentation to convert the emails array to a single email
    step.workflow_type === WorkflowType.Static
      ? {
          ...step,
          emails: step.emails[0],
        }
      : step

  const handleSubmit = useCallback(
    (step: FormWorkflowStep) =>
      updateStepMutation.mutate(
        {
          stepNumber,
          updateStepBody: step,
        },
        {
          onSuccess: () => setToInactive(),
        },
      ),
    [updateStepMutation, stepNumber, setToInactive],
  )

  return (
    <EditStepBlock
      stepNumber={stepNumber}
      isLoading={updateStepMutation.isLoading}
      handleOpenDeleteModal={handleOpenDeleteModal}
      onSubmit={handleSubmit}
      defaultValues={defaultValues}
      submitButtonLabel="Save step"
    />
  )
}
