import { useCallback } from 'react'

import { FormWorkflowStepDto, WorkflowType } from '~shared/types'

import {
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useWorkflowMutations } from '../../../mutations'
import { EditStepInputs } from '../../../types'
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
  const handleSubmit = useCallback(
    (inputs: EditStepInputs) =>
      updateStepMutation.mutate(
        {
          stepNumber,
          updateStepBody: {
            workflow_type: WorkflowType.Static,
            emails: [inputs.email],
          },
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
      defaultValues={{ email: step.emails[0] }}
      submitButtonLabel="Save changes"
    />
  )
}
