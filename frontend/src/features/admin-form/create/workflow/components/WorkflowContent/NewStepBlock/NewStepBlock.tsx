import { useCallback } from 'react'
import { BiPlus } from 'react-icons/bi'
import { Button } from '@chakra-ui/react'

import { WorkflowType } from '~shared/types'

import {
  isCreatingStateSelector,
  setToCreatingSelector,
  setToInactiveSelector,
  useAdminWorkflowStore,
} from '../../../adminWorkflowStore'
import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { useWorkflowMutations } from '../../../mutations'
import { EditStepInputs } from '../../../types'
import { EditStepBlock } from '../EditStepBlock'

export interface NewStepBlockProps {
  /** Prop to inject values for testing */
  _defaultValues?: Partial<EditStepInputs>
}

export const NewStepBlock = ({ _defaultValues }: NewStepBlockProps) => {
  const { formWorkflow } = useAdminFormWorkflow()
  const { createStepMutation } = useWorkflowMutations()
  const { isCreatingState, setToInactive, setToCreating } =
    useAdminWorkflowStore((state) => ({
      isCreatingState: isCreatingStateSelector(state),
      setToInactive: setToInactiveSelector(state),
      setToCreating: setToCreatingSelector(state),
    }))
  const handleSubmit = useCallback(
    (inputs: EditStepInputs) =>
      createStepMutation.mutate(
        {
          workflow_type: WorkflowType.Static,
          emails: [inputs.email],
        },
        {
          onSuccess: () => setToInactive(),
        },
      ),
    [createStepMutation, setToInactive],
  )

  if (!formWorkflow) return null

  return isCreatingState ? (
    <EditStepBlock
      stepNumber={formWorkflow.length}
      isLoading={createStepMutation.isLoading}
      defaultValues={_defaultValues}
      onSubmit={handleSubmit}
      submitButtonLabel="Add step"
    />
  ) : (
    <Button onClick={setToCreating} variant="outline" leftIcon={<BiPlus />}>
      Add step
    </Button>
  )
}
