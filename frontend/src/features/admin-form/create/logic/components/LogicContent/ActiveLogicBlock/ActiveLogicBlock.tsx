import { useCallback } from 'react'

import { LogicDto } from '~shared/types'

import {
  setToInactiveSelector,
  useAdminLogicStore,
} from '../../../adminLogicStore'
import { useLogicMutations } from '../../../mutations'
import { EditLogicInputs } from '../../../types'
import { EditLogicBlock } from '../EditLogicBlock'

export interface ActiveLogicBlockProps {
  logic: LogicDto
}

export const ActiveLogicBlock = ({
  logic,
}: ActiveLogicBlockProps): JSX.Element => {
  const { updateLogicMutation } = useLogicMutations()
  const setToInactive = useAdminLogicStore(setToInactiveSelector)
  const handleSubmit = useCallback(
    (inputs: EditLogicInputs) =>
      updateLogicMutation.mutate(
        { _id: logic._id, ...inputs },
        {
          onSuccess: () => setToInactive(),
        },
      ),
    [logic._id, setToInactive, updateLogicMutation],
  )

  return (
    <EditLogicBlock
      onSubmit={handleSubmit}
      defaultValues={logic}
      submitButtonLabel="Save changes"
    />
  )
}
