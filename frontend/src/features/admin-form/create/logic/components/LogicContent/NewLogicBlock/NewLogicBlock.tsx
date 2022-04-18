import { useCallback } from 'react'

import {
  setToInactiveSelector,
  useAdminLogicStore,
} from '../../../adminLogicStore'
import { useLogicMutations } from '../../../mutations'
import { EditLogicInputs } from '../../../types'
import { EditLogicBlock, useEditLogicBlockDefault } from '../EditLogicBlock'

export interface NewLogicBlockProps {
  useEditLogicBlock?: typeof useEditLogicBlockDefault
}

export const NewLogicBlock = ({
  useEditLogicBlock,
}: NewLogicBlockProps): JSX.Element => {
  const { createLogicMutation } = useLogicMutations()
  const setToInactive = useAdminLogicStore(setToInactiveSelector)
  const handleSubmit = useCallback(
    (inputs: EditLogicInputs) =>
      createLogicMutation.mutate(inputs, {
        onSuccess: () => setToInactive(),
      }),
    [createLogicMutation, setToInactive],
  )

  return (
    <EditLogicBlock
      onSubmit={handleSubmit}
      useEditLogicBlock={useEditLogicBlock}
    />
  )
}
