import { useCallback } from 'react'

import { LogicDto } from '~shared/types'

import {
  setToInactiveSelector,
  useAdminLogicStore,
} from '../../../adminLogicStore'
import { useLogicMutations } from '../../../mutations'
import { EditLogicInputs } from '../../../types'
import { EditLogicBlock, useEditLogicBlockDefault } from '../EditLogicBlock'

export interface ActiveLogicBlockProps {
  /** Used for testing override */
  useEditLogicBlock?: typeof useEditLogicBlockDefault
  logic: LogicDto
}

export const ActiveLogicBlock = ({
  useEditLogicBlock,
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
      logic={logic}
      useEditLogicBlock={useEditLogicBlock}
    />
  )
}
